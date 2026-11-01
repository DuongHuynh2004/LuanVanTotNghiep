import { cp, mkdir, readdir, unlink } from "node:fs/promises";
await mkdir(new URL("../../backend/public/app/", import.meta.url), {
  recursive: true,
});
const sourceAssets = new URL("../dist/assets/", import.meta.url);
const publishedAssets = new URL(
  "../../backend/public/app/assets/",
  import.meta.url,
);
await cp(
  new URL("../dist/", import.meta.url),
  new URL("../../backend/public/app/", import.meta.url),
  { recursive: true },
);
const currentAssets = new Set(await readdir(sourceAssets));
for (const entry of await readdir(publishedAssets, { withFileTypes: true })) {
  if (
    entry.isFile() &&
    /^index-[\w-]+\.(?:js|css)$/.test(entry.name) &&
    !currentAssets.has(entry.name)
  ) {
    await unlink(new URL(entry.name, publishedAssets));
  }
}
console.log(
  "Đã chép bản build vào backend/public/app. Mở Laravel hoặc Wamp virtual host để sử dụng.",
);
