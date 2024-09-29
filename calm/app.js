if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => {
        document.getElementById('status').innerText = 'All sounds cached. You can now go offline and meditate.';
    });
}

function playSound(src) {
    const player = document.getElementById('player');
    player.src = src;
    player.play();
}