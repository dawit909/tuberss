// Load the saved preference when the page opens
document.addEventListener('DOMContentLoaded', () => {
    // Default to 'videos' if no preference is saved yet
    chrome.storage.local.get({ feedType: 'videos' }, (data) => {
        document.querySelector(`input[name="feedType"][value="${data.feedType}"]`).checked = true;
    });
});

// Save the preference when the button is clicked
document.getElementById('save-btn').addEventListener('click', () => {
    const selectedType = document.querySelector('input[name="feedType"]:checked').value;
    
    chrome.storage.local.set({ feedType: selectedType }, () => {
        const status = document.getElementById('status');
        status.style.opacity = '1';
        setTimeout(() => {
            status.style.opacity = '0';
        }, 1500);
    });
});