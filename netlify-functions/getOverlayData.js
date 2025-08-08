// File: netlify/functions/getOverlayData.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

async function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      const credentialsBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
      if (!credentialsBase64) { throw new Error('FIREBASE_CREDENTIALS_BASE64 env var not set.'); }
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(credentialsJson);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (e) {
      console.error('Firebase admin initialization error:', e);
      throw new Error('Server Configuration Error: Could not initialize Firebase.');
    }
  }
}

exports.handler = async function(event, context) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'text/html' };

  try {
    await initializeFirebase();
    const db = admin.firestore();

    const apiKey = event.queryStringParameters.apiKey;
    if (!apiKey) { return { statusCode: 400, headers, body: '<p style="color:red;">Error: API key is missing.</p>' }; }

    const userResponse = await fetch(`https://api.torn.com/v2/user/?selections=profile&key=${apiKey}&comment=MyTornPA_Netlify`);
    const userData = await userResponse.json();
    if (userData.error) { return { statusCode: 401, headers, body: `<p style="color:red;">Torn API Error (User Check): ${userData.error.error}</p>` }; }
    
    const factionId = userData.faction.faction_id;
    if (!factionId) { return { statusCode: 404, headers, body: `<p style="color:orange;">User is not in a faction.</p>` }; }

    // --- THIS BLOCK HAS BEEN REFACTORED FOR STABILITY ---
    // Fetch and parse the JSON for both endpoints in parallel.
    const [membersData, cooldownsData] = await Promise.all([
        fetch(`https://api.torn.com/v2/faction/${factionId}?selections=members&key=${apiKey}&comment=MyTornPA_Netlify`).then(res => res.json()),
        fetch(`https://api.torn.com/v2/faction/${factionId}?selections=cooldowns&key=${apiKey}&comment=MyTornPA_Netlify`).then(res => res.json())
    ]);

    if (membersData.error) {
        return { statusCode: 500, headers, body: `<p style="color:red;">Torn API Error (Faction Members): ${membersData.error.error}</p>` };
    }
    
    const factionMembers = membersData.members;
    const factionCooldowns = cooldownsData.cooldowns;

    if (!factionMembers) {
         return { statusCode: 500, headers, body: `<p style="color:red;">Error: Could not retrieve faction members. Check API key permissions.</p>` };
    }
    // --- END OF REFACTORED BLOCK ---

    const memberIds = Object.keys(factionMembers);
    const memberProfiles = {};
    if (memberIds.length > 0) {
        const promises = [];
        for (let i = 0; i < memberIds.length; i += 10) {
            const chunk = memberIds.slice(i, i + 10);
            const query = db.collection('userProfiles').where('tornProfileId', 'in', chunk);
            promises.push(query.get());
        }
        const snapshots = await Promise.all(promises);
        snapshots.forEach(snapshot => snapshot.forEach(doc => {
            const docData = doc.data();
            if (docData.tornProfileId) { memberProfiles[docData.tornProfileId] = docData; }
        }));
    }

    const privateDataPromises = [];
    for (const id in memberProfiles) {
        const profile = memberProfiles[id];
        if (profile && profile.tornApiKey) {
            const privateDataPromise = fetch(`https://api.torn.com/v2/user/${id}?selections=bars&key=${profile.tornApiKey}&comment=MyTornPA_Netlify`)
                .then(res => res.json())
                .then(data => ({ id, data }));
            privateDataPromises.push(privateDataPromise);
        }
    }
    const privateDataResults = await Promise.all(privateDataPromises);
    const privateEnergyData = {};
    privateDataResults.forEach(result => {
        if (result.data && !result.data.error) {
            privateEnergyData[result.id] = result.data;
        }
    });

    let rowsHtml = '';
    for (const id in factionMembers) {
        const publicInfo = factionMembers[id];
        const cooldown = factionCooldowns ? factionCooldowns[id] : {};
        const privateInfo = privateEnergyData[id] || {};
        const energy = (privateInfo.energy) ? `${privateInfo.energy.current}/${privateInfo.energy.maximum}` : 'N/A';
        const drugCooldown = formatDrugCooldown(cooldown?.drug ?? 0);

        rowsHtml += `
            <div class="member-row">
                <span style="flex: 3; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;"><a href="https://www.torn.com/profiles.php?XID=${id}" target="_blank">${publicInfo.name}</a></span>
                <span style="flex: 2; text-align: center;">${publicInfo.status.description}</span>
                <span style="flex: 3; text-align: center;">${energy}</span>
                <span style="flex: 2; text-align: right;" class="${drugCooldown.className}">${drugCooldown.value}</span>
            </div>
        `;
    }

    const headerHtml = `
        <div class="member-row" style="font-weight: bold; border-bottom: 2px solid #555;">
            <span style="flex: 3;">Name</span>
            <span style="flex: 2; text-align: center;">Status</span>
            <span style="flex: 3; text-align: center;">Energy</span>
            <span style="flex: 2; text-align: right;">Drug CD</span>
        </div>
    `;
    
    return { statusCode: 200, headers, body: `<div class="member-list">${headerHtml}${rowsHtml}</div>` };

  } catch (error) {
    console.error('Error in Netlify function handler:', error);
    return { statusCode: 500, headers, body: `<p style="color:red;">A server error occurred: ${error.message}</p>` };
  }
};

function formatDrugCooldown(cooldownValue) {
    if (cooldownValue > 0) {
        const hours = Math.floor(cooldownValue / 3600);
        const minutes = Math.floor((cooldownValue % 3600) / 60);
        const value = `${hours > 0 ? `${hours}h ` : ''}${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
        let className = 'status-okay';
        if (cooldownValue > 18000) className = 'status-hospital';
        else if (cooldownValue > 7200) className = 'status-other';
        return { value, className };
    } else {
        return { value: 'None 🍁', className = 'status-okay' };
    }
}