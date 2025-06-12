document.addEventListener("DOMContentLoaded", function () {
    // Ensure Video.js is available
    if (typeof videojs === 'undefined') {
        console.error("Video.js failed to load.");
        return;
    }

    var player = videojs('live-stream', {
        autoplay: false,
        controls: true,
        muted: false,
        preload: "auto"
    });

    var statusText = document.getElementById("status");
    var streamURL = "https://guessthename.infinityfreeapp.com/nginx/html/hls/test.m3u8";

    function checkStream() {
        fetch(streamURL, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log("Stream is live!");
                    statusText.innerText = "Live stream available!";
                    
                    // Set the video source properly
                    player.src({ src: streamURL, type: "application/x-mpegURL" });
                    player.load();
                    player.play().catch(() => {
                        console.log("Autoplay blocked. User interaction needed.");
                    });

                } else {
                    console.log("Stream not available. Retrying...");
                    setTimeout(checkStream, 5000);
                }
            })
            .catch(() => {
                console.log("Error checking stream, retrying...");
                setTimeout(checkStream, 5000);
            });
    }

    setTimeout(checkStream, 2000);
});
