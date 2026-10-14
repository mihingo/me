import { validateContent } from './content';
const data = validateContent();
console.log(`Content valid: ${data.experience.length} roles, ${data.projects.length} projects. Links, dates, company IDs, architecture and theme contrast checked.`);
