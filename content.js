let avatarContainer = null;

// Reliably fetch Channel ID (YouTube includes a native RSS feed link tag in the <head> of every channel)
function getChannelId() {
    const rssLink = document.querySelector('link[type="application/rss+xml"]');
    if (rssLink && rssLink.href.includes('channel_id=')) {
        return rssLink.href.split('channel_id=')[1];
    }
    
    const meta = document.querySelector('meta[itemprop="channelId"]') || 
                 document.querySelector('meta[itemprop="identifier"]');
    if (meta && meta.content) return meta.content;

    const match = document.head.innerHTML.match(/["'](?:channelId|externalId)["']\s*:\s*["'](UC[\w-]+)["']/);
    return match ? match[1] : null;
}

function createUIElements() {
    if (!document.getElementById('yt-rss-tooltip')) {
        const tooltip = document.createElement('div');
        tooltip.id = 'yt-rss-tooltip';
        tooltip.textContent = 'Copy RSS feed';
        document.body.appendChild(tooltip);
    }

    if (!document.getElementById('yt-rss-toast')) {
        const toast = document.createElement('div');
        toast.id = 'yt-rss-toast';
        toast.textContent = 'Copied to clipboard';
        document.body.appendChild(toast);
    }
}

function showToast() {
    const toast = document.getElementById('yt-rss-toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function handleAvatarClick(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const channelId = getChannelId();
    if (!channelId) {
        console.error('[YouTube RSS] Unable to resolve Channel ID');
        return;
    }

    chrome.storage.local.get({ feedType: 'videos' }, (data) => {
        let url = '';
        if (data.feedType === 'all') {
            url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        } else {
            const uulfId = channelId.replace(/^UC/, 'UULF');
            url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${uulfId}`;
        }

        navigator.clipboard.writeText(url).then(() => {
            showToast();
        });
    });
}

function positionTooltip() {
    const tooltip = document.getElementById('yt-rss-tooltip');
    if (!tooltip || !avatarContainer) return;

    const rect = avatarContainer.getBoundingClientRect();
    const centerX = rect.left + window.scrollX + (rect.width / 2);
    const bottomY = rect.bottom + window.scrollY + 8; // 8px below the avatar's bottom edge

    tooltip.style.left = `${centerX}px`;
    tooltip.style.top = `${bottomY}px`;
}

function attachAvatarListeners() {
    const target = document.querySelector('yt-decorated-avatar-view-model') ||
                   document.querySelector('yt-avatar-shape') ||
                   document.querySelector('.ytPageHeaderViewModelHeadlineImage');

    if (target && target !== avatarContainer) {
        avatarContainer = target;
        avatarContainer.classList.add('yt-rss-avatar-ready');

        const tooltip = document.getElementById('yt-rss-tooltip');

        avatarContainer.addEventListener('mouseenter', () => {
            if (tooltip) {
                positionTooltip();
                tooltip.style.opacity = '1';
            }
        });

        avatarContainer.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.style.opacity = '0';
            }
        });

        avatarContainer.addEventListener('click', handleAvatarClick, true);
    }
}

function checkAndInject() {
    createUIElements();
    attachAvatarListeners();
}

// Continuous polling loop to handle dynamic SPA page loads
setInterval(checkAndInject, 500);

document.addEventListener('yt-navigate-finish', checkAndInject);