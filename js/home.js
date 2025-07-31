if (toolsSection) {
    toolsSection.addEventListener('click', async function(event) {
        const link = event.target.closest('.tool-item-button');
        if (!link) {
            return;
        }

        const needsMembership = link.classList.contains('member-only');
        // If it's a public link (doesn't need membership), do nothing and let it navigate normally.
        if (!needsMembership) {
            return;
        }

        // If we've reached this point, it IS a member-only link.
        // We must stop the default navigation right now, before any 'await' calls.
        event.preventDefault();

        const profile = currentUserProfile;
        const hasAgreedToTerms = profile ? profile.termsAgreed === true : false;
        
        // First, check if the issue is a lack of terms agreement.
        if (!hasAgreedToTerms) {
            const termsPromptModal = document.getElementById('termsPromptModal');
            if (termsPromptModal) termsPromptModal.style.display = 'flex';
            return; // Stop here, show the terms modal.
        }

        // Now we can safely perform the async membership check.
        let isMember = false;
        if (profile) {
            const hasPaidMembership = profile.membershipEndTime && profile.membershipEndTime > Date.now();
            const hasPersonalComp = profile.hasFreeAccess === true;
            const hasFactionComp = await isFactionComped(profile, db);
            isMember = hasPaidMembership || hasPersonalComp || hasFactionComp;
        }

        // After checking, decide what to do.
        if (isMember) {
            // If they are a member, navigate to the link's URL for them.
            window.location.href = link.href;
        } else {
            // If they are NOT a member, show the subscribe modal.
            const subscribeModal = document.getElementById('subscribePromptModal');
            if (subscribeModal) subscribeModal.style.display = 'flex';
        }
    });
}