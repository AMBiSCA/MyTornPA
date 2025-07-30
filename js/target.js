const BACKEND_URL = "http://localhost:3000"; // Change if hosted on Render or elsewhere

async function submitStats() {
  const apiKey = document.getElementById("apiKey").value.trim();
  const anonymous = document.getElementById("anonymous").checked;

  if (!apiKey) {
    alert("Please enter your API key.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/submit-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, anonymous }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Stats submitted successfully!");
    } else {
      alert(data.error || "Failed to submit stats.");
    }
  } catch (err) {
    alert("Error connecting to backend.");
    console.error(err);
  }
}

async function findMatches() {
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!apiKey) {
    alert("Please enter your API key.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/find-matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    const data = await res.json();

    if (data.matches && data.matches.length > 0) {
      let html = "<h3>Fair Fight Matches Found:</h3><ul>";
      data.matches.forEach((match) => {
        const safeName = match.name === "Anonymous" ? null : match.name;
        const profileURL = safeName
          ? `https://www.torn.com/profiles.php?XID=${safeName}`
          : "#";

        html += `<li>
          ${match.name} — Level ${match.level} — Estimated Stats: ${Math.round(match.totalStats).toLocaleString()}
          ${
            safeName
              ? `<button onclick="window.open('${profileURL}', '_blank')">Attack</button>`
              : ""
          }
        </li>`;
      });
      html += "</ul>";
      document.getElementById("results").innerHTML = html;
    } else {
      document.getElementById("results").innerHTML = "<p>No matches found.</p>";
    }
  } catch (err) {
    alert("Error connecting to backend.");
    console.error(err);
  }
}

async function goToProfile() {
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!apiKey) {
    alert("Please enter your API key.");
    return;
  }

  try {
    const res = await fetch(`https://api.torn.com/user/?selections=basic&key=${apiKey}`);
    const data = await res.json();

    if (data.error) {
      alert("Invalid API key.");
      return;
    }

    const profileURL = `https://www.torn.com/profiles.php?XID=${data.player_id}`;
    window.open(profileURL, "_blank");
  } catch (err) {
    alert("Failed to fetch your profile.");
    console.error(err);
  }
}