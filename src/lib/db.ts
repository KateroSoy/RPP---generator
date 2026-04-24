export const HARDCODED_USERS = [
  { id: "user_1", name: "Hasra Jaya", email: "hasrajaya03@gmail.com", password: "123456" },
  { id: "user_2", name: "Budi Santoso", email: "budi@guru.com", password: "password" },
  { id: "user_3", name: "Siti Aminah", email: "siti@guru.com", password: "password" }
];

export function getLocalUsers() {
  const users = localStorage.getItem('rpp_users');
  if (users) {
    return JSON.parse(users);
  }
  localStorage.setItem('rpp_users', JSON.stringify(HARDCODED_USERS));
  return HARDCODED_USERS;
}

export function saveLocalUser(user: any) {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem('rpp_users', JSON.stringify(users));
}

export function getRppDocuments() {
  const docs = localStorage.getItem('rpp_documents');
  return docs ? JSON.parse(docs) : [];
}

export function saveRppDocument(doc: any) {
  const docs = getRppDocuments();
  if (!doc.id) {
    doc.id = Math.random().toString(36).substr(2, 9);
  }
  docs.push(doc);
  localStorage.setItem('rpp_documents', JSON.stringify(docs));
  return doc.id;
}

export function updateRppDocument(id: string, updates: any) {
  const docs = getRppDocuments();
  const index = docs.findIndex((d: any) => d.id === id);
  if (index !== -1) {
    docs[index] = { ...docs[index], ...updates };
    localStorage.setItem('rpp_documents', JSON.stringify(docs));
  }
}

export function deleteRppDocument(id: string) {
  let docs = getRppDocuments();
  docs = docs.filter((d: any) => d.id !== id);
  localStorage.setItem('rpp_documents', JSON.stringify(docs));
}

export function getRppDocumentById(id: string) {
  const docs = getRppDocuments();
  return docs.find((d: any) => d.id === id);
}

export function canGenerateRPP(userId: string): boolean {
  const today = new Date().toDateString();
  const usageStr = localStorage.getItem(`rpp_usage_${userId}`);
  if (!usageStr) return true;

  const usage = JSON.parse(usageStr);
  if (usage.date !== today) return true; // reset on new day
  return usage.count < 5;
}

export function incrementGenerateCount(userId: string) {
  const today = new Date().toDateString();
  const usageStr = localStorage.getItem(`rpp_usage_${userId}`);
  let usage = usageStr ? JSON.parse(usageStr) : { date: today, count: 0 };

  if (usage.date !== today) {
    usage = { date: today, count: 1 };
  } else {
    usage.count += 1;
  }
  localStorage.setItem(`rpp_usage_${userId}`, JSON.stringify(usage));
}
