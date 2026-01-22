import { Advisor, Category } from '../types';
import { MOCK_ADVISORS, INITIAL_CATEGORIES } from '../constants';

const ADVISORS_KEY = 'lumina_advisors';
const CATEGORIES_KEY = 'lumina_categories';

export const dataService = {
  getAdvisors: (): Advisor[] => {
    try {
      const stored = localStorage.getItem(ADVISORS_KEY);
      return stored ? JSON.parse(stored) : MOCK_ADVISORS;
    } catch (e) {
      console.error("Failed to load advisors", e);
      return MOCK_ADVISORS;
    }
  },
  saveAdvisors: (advisors: Advisor[]) => {
    try {
      localStorage.setItem(ADVISORS_KEY, JSON.stringify(advisors));
      // Dispatch storage event to sync across tabs if on same origin
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Failed to save advisors", e);
    }
  },
  getCategories: (): Category[] => {
    try {
      const stored = localStorage.getItem(CATEGORIES_KEY);
      return stored ? JSON.parse(stored) : INITIAL_CATEGORIES;
    } catch (e) {
      console.error("Failed to load categories", e);
      return INITIAL_CATEGORIES;
    }
  },
  saveCategories: (categories: Category[]) => {
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error("Failed to save categories", e);
    }
  }
};
