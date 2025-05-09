import { config } from 'dotenv';
config();

import '@/ai/flows/detect-recurring-charges.ts';
import '@/ai/flows/suggest-subscription-alternatives.ts';
import '@/ai/flows/predict-renewal-dates.ts';