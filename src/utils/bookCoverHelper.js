export const getCategoryCoverImage = (category) => {
  const normalized = category?.toLowerCase().trim() || "";

  if (normalized.includes("matemática"))
    return "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("fisica") || normalized.includes("física"))
    return "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("quimica") || normalized.includes("química"))
    return "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80";

  if (normalized.includes("redes"))
    return "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=500&q=80";

  if (
    normalized.includes("programacion") ||
    normalized.includes("programación")
  )
    return "https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("sistemas"))
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("estadistica") || normalized.includes("estadística"))
    return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80";

  if (normalized.includes("gestion") || normalized.includes("gestión"))
    return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=500&q=80";

  return "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=500&q=80";
};