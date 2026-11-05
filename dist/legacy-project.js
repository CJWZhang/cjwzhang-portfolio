const destinations = { "#ramp": "ramp.html", "#agents": "everant.html" };
window.location.replace(destinations[window.location.hash] || "index.html#work");
