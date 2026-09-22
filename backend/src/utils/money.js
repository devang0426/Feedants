/**
 * All amounts are stored as integers in the smallest currency unit (paise for
 * INR) to avoid floating-point errors. Display formatting is done client-side.
 */
export const rupeesToPaise = (rupees) => Math.round(rupees * 100);
export const paiseToRupees = (paise) => paise / 100;
