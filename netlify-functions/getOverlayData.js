// File: netlify/functions/getOverlayData.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

async function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      const credentialsBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
      if (!credentialsBase64) { throw new Error('FIREBASE_CREDENTIALS_BASE64 environment variable not set.'); }
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(credentialsJson);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (e) {
      console.error('Firebase admin initialization error:', e);
      throw new Error('Server Configuration Error: Could not initialize Firebase. Check credentials.');
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

    const userResponse = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}&comment=MyTornPA_Netlify`);
    const userData = await userResponse.json();
    if (userData.error) { return { statusCode: 401, headers, body: `<p style="color:red;">Torn API Error (User Check): ${userData.error.error}</p>` }; }
    
    const factionId = userData.faction.faction_id;
    if (!factionId) { return { statusCode: 404, headers, body: `<p style="color:orange;">User is not in a faction.</p>` }; }

    // --- THIS BLOCK HAS BEEN IMPROVED WITH BETTER ERROR CHECKING ---
    const membersPromise = fetch(`https://api.torn.com/faction/${factionId}?selections=members&key=${apiKey}&comment=MyTornPA_Netlify`);
    const cooldownsPromise = fetch(`https://api.torn.com/faction/${factionId}?selections=cooldowns&key=${apiKey}&comment=MyTornPA_Netlify`);

    const [membersResponse, cooldownsResponse] = await Promise.all([membersPromise, cooldownsPromise]);
    const membersData = await membersResponse.json();
    const cooldownsData = await cooldownsResponse.json();

    // Check if the API returned an error in the response body
    if (membersData.error) {
        return { statusCode: 500, headers, body: `<p style="color:red;">Torn API Error (Faction Members): ${membersData.error.error}</p>` };
    }
    
    const factionMembers = membersData.members;
    const factionCooldowns = cooldownsData.cooldowns; // Cooldowns can be null if key is public, which is fine

    if (!factionMembers) {
         return { statusCode: 500, headers, body: `<p style="color:red;">Error: Could not retrieve faction members. Check API key permissions.</p>` };
    }
    // --- END OF IMPROVED BLOCK ---

    const memberIds = Object.keys(factionMembers);
    const firestoreData = {};
    if (memberIds.length > 0) {
        const promises = [];
        for (let i = 0; i < memberIds.length; i += 10) {
            const chunk = memberIds.slice(i, i + 10);
            const query = db.collection('overlayinfo').where(admin.firestore.FieldPath.documentId(), 'in', chunk);
            promises.push(query.get());
        }
        const snapshots = await Promise.all(promises);
        snapshots.forEach(snapshot => snapshot.forEach(doc => firestoreData[doc.id] = doc.data()));
    }

    let rowsHtml = '';
    for (const id in factionMembers) {
        const member = factionMembers[id];
        const cooldown = factionCooldowns ? factionCooldowns[id] : {};
        const privateInfo = firestoreData[id] || {};
        const energy = `${privateInfo.energy?.current ?? 'N/A'} / ${privateInfo.energy?.maximum ?? 'N/A'}`;
        const drugCooldown = formatDrugCooldown(cooldown?.drug ?? 0);

        rowsHtml += `
            <div class="member-row">
                <span style="flex: 3; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;"><a href="https://www.torn.com/profiles.php?XID=${id}" target="_blank">${member.name}</a></span>
                <span style="flex: 2; text-align: center;">${member.status.description}</span>
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
    
    const finalHtml = `<div class="member-list">${headerHtml}${rowsHtml}</div>`;
    
    return { statusCode: 200, headers, body: finalHtml, };
  } catch (error) {
    console.error('Error in Netlify function handler:', error);
    return { statusCode: 500, headers, body: `<p style="color:red;">A server error occurred: ${error.message}</p>`, };
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
        return { value: 'None 🍁', className: 'status-okay' };
    }
}