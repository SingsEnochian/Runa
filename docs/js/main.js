document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");
  const clearBtn = document.getElementById("clearCanvas");
  const cameraToggle = document.getElementById("cameraToggle");
  const body = document.body;
  const heading = document.getElementById("modeTitle");
  const statusText = document.getElementById("statusText");
  const stage = document.querySelector(".ar-stage");
  const cameraFeed = document.getElementById("cameraFeed");
  const canvas = document.getElementById("arCanvas");

  const ctx = canvas.getContext("2d");
  let stream;
  let drawing = false;
  let lastPoint = null;
  let strokeHue = 42;
  let audioCtx;

  const resizeCanvas = () => {
    const rect = stage.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const magicalChime = (frequency = 523.25, gainValue = 0.08) => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const shimmer = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.25, now + 0.22);

    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(frequency * 2, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainValue, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc.connect(gain);
    shimmer.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    shimmer.start(now);
    osc.stop(now + 0.75);
    shimmer.stop(now + 0.75);
  };

  const toCanvasPoint = (touch) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  };

  const drawSegment = (from, to) => {
    strokeHue = (strokeHue + 2.2) % 360;
    const bodyCelestial = body.classList.contains("celestial");
    const sat = bodyCelestial ? "90%" : "76%";
    const light = bodyCelestial ? "77%" : "62%";
    const glow = bodyCelestial ? "rgba(182, 219, 255, 0.72)" : "rgba(255, 212, 102, 0.68)";

    ctx.strokeStyle = `hsl(${strokeHue}, ${sat}, ${light})`;
    ctx.lineWidth = bodyCelestial ? 4.2 : 4.8;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  stage.addEventListener("touchstart", (event) => {
    event.preventDefault();
    if (!event.touches.length) return;

    const point = toCanvasPoint(event.touches[0]);
    drawing = true;
    lastPoint = point;
    magicalChime(659.25, 0.09);
  }, { passive: false });

  stage.addEventListener("touchmove", (event) => {
    event.preventDefault();
    if (!drawing || !event.touches.length) return;

    const point = toCanvasPoint(event.touches[0]);
    drawSegment(lastPoint, point);
    if (Math.random() > 0.86) {
      magicalChime(440 + Math.random() * 280, 0.045);
    }
    lastPoint = point;
  }, { passive: false });

  const stopDrawing = () => {
    if (drawing) {
      magicalChime(783.99, 0.05);
    }
    drawing = false;
    lastPoint = null;
  };

  stage.addEventListener("touchend", stopDrawing);
  stage.addEventListener("touchcancel", stopDrawing);

  const startCamera = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
        },
      });
      cameraFeed.srcObject = stream;
      cameraToggle.textContent = "Camera Enabled";
      cameraToggle.disabled = true;
      statusText.textContent = "AR view active. Draw glowing runes directly on the live camera feed.";
      magicalChime(523.25, 0.06);
    } catch (error) {
      console.error(error);
      statusText.textContent = "Camera access was denied. You can still draw on the dark magical stage.";
      cameraToggle.textContent = "Retry Camera";
      cameraToggle.disabled = false;
    }
  };

  toggleBtn.addEventListener("click", () => {
    const celestial = body.classList.toggle("celestial");

    if (celestial) {
      heading.textContent = "Celestial Mode";
      toggleBtn.textContent = "Switch to Norse";
      magicalChime(698.46, 0.07);
    } else {
      heading.textContent = "Norse Mode";
      toggleBtn.textContent = "Switch to Celestial";
      magicalChime(493.88, 0.07);
    }
  });

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    magicalChime(587.33, 0.06);
  });

  cameraToggle.addEventListener("click", async () => {
    await startCamera();
  });

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
});
