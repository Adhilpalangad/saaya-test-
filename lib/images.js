export function galleryImage(item, width = 700) {
  if (!item?.public_id) return item?.src || '';
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // Use the trusted stored URL's cloud name so no additional browser secret is needed.
  const match = item.src?.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\//);
  const name = match?.[1] || cloud;
  if (!name) return item.src;
  return `https://res.cloudinary.com/${name}/image/upload/f_auto,q_auto,w_${width},c_limit/${item.public_id}`;
}
