const ImageKit = require('@imagekit/nodejs').default;

const ik = new ImageKit({
  publicKey: 'public_FbG6o9/Gza1lJF3F1oGgSggg+W0=',
  privateKey: 'private_1Vng+pmL8U3AkZ5EaP+pnQ+BZKI=',
  baseURL: 'https://ik.imagekit.io/iffvyadre'
});

async function run() {
  try {
    const auth = ik.helper.getAuthenticationParameters();
    console.log("Auth:", auth);

    const formData = new FormData();
    // dummy text file
    const blob = new Blob(["test"], { type: "text/plain" });
    formData.append("file", blob, "test.txt");
    formData.append("fileName", "test.txt");
    formData.append("folder", "/test");
    formData.append("publicKey", 'public_FbG6o9/Gza1lJF3F1oGgSggg+W0=');
    formData.append("signature", auth.signature);
    formData.append("expire", String(auth.expire));
    formData.append("token", auth.token);

    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: formData
    });

    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}

run();
