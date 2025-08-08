const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let originalImageData = null;

document.getElementById("imageInput").addEventListener("change", function (e) {
  const file = e.target.files[0];
  const reader = new FileReader();

  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      originalImageData = ctx.getImageData(0, 0, img.width, img.height);
    };
    img.src = event.target.result;
  };

  if (file) reader.readAsDataURL(file);
});

document.getElementById("methodSelect").addEventListener("change", function () {
  const method = this.value;
  document.getElementById("mathOptions").classList.toggle("hidden", method !== "math");
});

function encryptImage() {
  const method = document.getElementById("methodSelect").value;
  const key = parseInt(document.getElementById("keyInput").value);

  if (!originalImageData) return alert("Upload an image first!");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  if (method === "swap") {
    const pixelCount = data.length / 4;
    const order = generateShuffledOrder(pixelCount, key);
    const newData = new Uint8ClampedArray(data.length);

    for (let i = 0; i < pixelCount; i++) {
      const fromIndex = i * 4;
      const toIndex = order[i] * 4;
      for (let j = 0; j < 4; j++) {
        newData[toIndex + j] = data[fromIndex + j];
      }
    }
    imageData.data.set(newData);

  } else if (method === "math") {
    const operation = document.getElementById("operationSelect").value;

    if (operation === "multiply" && gcd(key, 256) !== 1) {
      alert("❌ Key is not invertible (GCD(key, 256) ≠ 1). Choose another key.");
      return;
    }

    for (let i = 0; i < data.length; i += 4) {
      for (let j = 0; j < 3; j++) {
        switch (operation) {
          case "add":
            data[i + j] = (data[i + j] + key) % 256;
            break;
          case "subtract":
            data[i + j] = (data[i + j] - key + 256) % 256;
            break;
          case "multiply":
            data[i + j] = (data[i + j] * key) % 256;
            break;
          case "xor":
            data[i + j] = data[i + j] ^ key;
            break;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function decryptImage() {
  const method = document.getElementById("methodSelect").value;
  const key = parseInt(document.getElementById("keyInput").value);

  if (!originalImageData) return alert("Upload an image first!");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  if (method === "swap") {
    const pixelCount = data.length / 4;
    const order = generateShuffledOrder(pixelCount, key);
    const newData = new Uint8ClampedArray(data.length);

    for (let i = 0; i < pixelCount; i++) {
      const fromIndex = order[i] * 4;
      const toIndex = i * 4;
      for (let j = 0; j < 4; j++) {
        newData[toIndex + j] = data[fromIndex + j];
      }
    }
    imageData.data.set(newData);

  } else if (method === "math") {
    const operation = document.getElementById("operationSelect").value;

    if (operation === "multiply") {
      if (gcd(key, 256) !== 1) {
        alert("❌ Key is not invertible. Cannot decrypt multiply.");
        return;
      }

      const inverse = modInverse(key, 256);
      if (inverse === null) {
        alert("❌ No modular inverse found.");
        return;
      }

      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          data[i + j] = (data[i + j] * inverse) % 256;
        }
      }

    } else {
      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          switch (operation) {
            case "add":
              data[i + j] = (data[i + j] - key + 256) % 256;
              break;
            case "subtract":
              data[i + j] = (data[i + j] + key) % 256;
              break;
            case "xor":
              data[i + j] = data[i + j] ^ key;
              break;
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function generateShuffledOrder(length, key) {
  const order = [...Array(length).keys()];
  let seed = key;

  for (let i = order.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  return order;
}

function gcd(a, b) {
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

function modInverse(a, m) {
  a %= m;
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  return null;
}
function downloadImage() {
  const link = document.createElement("a");
  link.download = "modified-image.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}
