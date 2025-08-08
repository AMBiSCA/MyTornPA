// File: netlify/functions/getOverlayData.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// This function will initialize Firebase, but only if it hasn't been already.
// This is a robust way to handle both "cold" and "warm" function starts.
async function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin Initialized successfully.');
    } catch (e) {
      console.error('Firebase admin initialization error:', e);
      // Throw a specific error if initialization fails
      throw new Error('Server Configuration Error: Could not initialize Firebase. Check credentials.');
    }
  }
}

// The main function handler
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/html',
  };

  try {
    // Run our initialization function first
    await initializeFirebase();
    const db = admin.firestore();

    const apiKey = event.queryStringParameters.apiKey;
    if (!apiKey) {
      return { statusCode: 400, headers, body: '<p style="color:red;">Error: API key is missing.</p>' };
    }

    // 1. Get user's faction ID using their API key
    const userResponse = await fetch(`https://api.torn.com/user/?selections=profile&key=${apiKey}&comment=MyTornPA_Netlify`);
    const userData = await userResponse.json();
    if (userData.error) {
      return { statusCode: 401, headers, body: `<p style="color:red;">Torn API Error: ${userData.error.error}</p>` };
    }
    const factionId = userData.faction.faction_id;
    if (!factionId) {
        return { statusCode: 404, headers, body: `<p style="color:orange;">User is not in a faction.</p>` };
    }


    // 2. Get faction members and cooldowns from Torn API
    const factionResponse = await fetch(`https://api.torn.com/faction/${factionId}?selections=members,cooldowns&key=${apiKey}&comment=MyTornPA_Netlify`);
    const factionData = await factionResponse.json();
    if (factionData.error) {
      return { statusCode: 500, headers, body: `<p style="color:red;">Torn API Error: ${factionData.error.error}</p>` };
    }

    // 3. Get private energy data from your Firestore database
    const memberIds = Object.keys(factionData.members);
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


    // 4. Build the HTML response
    let rowsHtml = '';
    for (const id in factionData.members) {
        const member = factionData.members[id];
        const cooldown = factionData.cooldowns[id];
        const privateInfo = firestoreData[id] || {};

        const energy = `${privateInfo.energy?.current ?? 'N/A'} / ${privateInfo.energy?.maximum ?? 'N/A'}`;
        const drugCooldown = formatDrugCooldown(cooldown?.drug ?? 0);

        // This HTML is injected into the Tampermonkey panel
        rowsHtml += `
            <div class="member-row">
                <span style="flex: 3; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;"><a href="https://www.torn.com/profiles.php?XID=${id}" target="_blank">${member.name}</a></span>
                <span style="flex: 2; text-align: center;">${member.status.description}</span>
                <span style="flex: 3; text-align: center;">${energy}</span>
                <span style="flex: 2; text-align: right;" class="${drugCooldown.className}">${drugCooldown.value}</span>
            </div>
        `;
    }

    // Add a simple header row
    const headerHtml = `
        <div class="member-row" style="font-weight: bold; border-bottom: 2px solid #555;">
            <span style="flex: 3;">Name</span>
            <span style="flex: 2; text-align: center;">Status</span>
            <span style="flex: 3; text-align: center;">Energy</span>
            <span style="flex: 2; text-align: right;">Drug CD</span>
        </div>
    `;
    
    const finalHtml = `<div class="member-list">${headerHtml}${rowsHtml}</div>`;
    
    return {
      statusCode: 200,
      headers,
      body: finalHtml,
    };

  } catch (error) {
    console.error('Error in Netlify function handler:', error);
    return {
      statusCode: 500,
      headers,
      body: `<p style="color:red;">A server error occurred: ${error.message}</p>`,
    };
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