import { usePrefsStore, type Lang } from '../stores/prefs.store';

// Small client-side dictionary (English / हिन्दी). Missing keys fall back to English, then to the key itself.
const en = {
  'nav.stays': 'Stays', 'nav.food': 'Food', 'nav.parking': 'Parking', 'nav.health': 'Health', 'nav.shop': 'Shop', 'nav.rentals': 'Rentals',
  'nav.browse': 'Browse', 'nav.scan': 'Scan', 'nav.cart': 'Cart', 'nav.orders': 'Orders', 'nav.profile': 'Profile',
  'nav.scanQr': 'Scan QR', 'nav.login': 'Log in',
  'hero.title': 'Book anything, nearby.', 'hero.sub': 'Stays, food, parking, rentals, health and shops in one place.',
  'hero.location': 'Location', 'hero.business': 'Business', 'hero.allBusinesses': 'All businesses', 'hero.businessSearch': 'Search businesses…', 'hero.allLocations': 'Pick a location', 'hero.type': 'Type', 'hero.date': 'Date', 'hero.guests': 'Guests', 'hero.search': 'Search…',
  'qr.cta': 'At a venue, bay, bike or table? Scan its QR.',
  'qr.ctaSub': 'Company, business, location and resource are selected for you, so you land straight on the booking.',
  'near': 'near', 'add': 'Add', 'book': 'Book', 'unavailable': 'Unavailable',
  'cart.title': 'Your cart', 'cart.empty': 'Your cart is empty. Add something from the list.', 'cart.checkout': 'Checkout',
  'cart.inclTax': 'Taxes included', 'cart.total': 'Total',
  'pay.title': 'Payment', 'pay.upi': 'UPI (GPay, PhonePe)', 'pay.card': 'Debit / Credit card', 'pay.venue': 'Pay at venue',
  'pay.now': 'Pay now', 'pay.secured': 'Secured by Razorpay.', 'back': 'Back', 'cancel': 'Cancel', 'done': 'Done',
  'confirm.title': 'Booking confirmed', 'orders.title': 'My orders', 'orders.live': 'Live status updates', 'refresh': 'Refresh', 'updated': 'Updated', 'receipt': 'Receipt',
  'profile.title': 'Profile', 'profile.bookings': 'My bookings', 'profile.saved': 'Saved locations', 'profile.payments': 'Payment methods',
  'profile.language': 'Language', 'profile.refer': 'Refer & earn', 'profile.copy': 'Copy', 'logout': 'Log out',
} as const;

export type TKey = keyof typeof en;

const hi: Partial<Record<TKey, string>> = {
  'nav.stays': 'ठहरें', 'nav.food': 'भोजन', 'nav.parking': 'पार्किंग', 'nav.health': 'स्वास्थ्य', 'nav.shop': 'दुकान', 'nav.rentals': 'किराया',
  'nav.browse': 'खोजें', 'nav.scan': 'स्कैन', 'nav.cart': 'कार्ट', 'nav.orders': 'ऑर्डर', 'nav.profile': 'प्रोफ़ाइल',
  'nav.scanQr': 'QR स्कैन करें', 'nav.login': 'लॉग इन',
  'hero.title': 'आस-पास कुछ भी बुक करें।', 'hero.sub': 'ठहरना, भोजन, पार्किंग, किराया, स्वास्थ्य और दुकानें — एक ही जगह।',
  'hero.location': 'स्थान', 'hero.business': 'व्यवसाय', 'hero.allBusinesses': 'सभी व्यवसाय', 'hero.businessSearch': 'व्यवसाय खोजें…', 'hero.allLocations': 'स्थान चुनें', 'hero.type': 'प्रकार', 'hero.date': 'तारीख़', 'hero.guests': 'मेहमान', 'hero.search': 'खोजें…',
  'qr.cta': 'किसी जगह, बे, बाइक या टेबल पर हैं? उसका QR स्कैन करें।',
  'qr.ctaSub': 'कंपनी, व्यवसाय, स्थान और संसाधन अपने-आप चुने जाते हैं।',
  'near': 'के पास', 'add': 'जोड़ें', 'book': 'बुक करें', 'unavailable': 'उपलब्ध नहीं',
  'cart.title': 'आपका कार्ट', 'cart.empty': 'आपका कार्ट ख़ाली है। सूची से कुछ जोड़ें।', 'cart.checkout': 'चेकआउट',
  'cart.inclTax': 'कर सहित', 'cart.total': 'कुल',
  'pay.title': 'भुगतान', 'pay.upi': 'UPI (GPay, PhonePe)', 'pay.card': 'डेबिट / क्रेडिट कार्ड', 'pay.venue': 'स्थान पर भुगतान',
  'pay.now': 'अभी भुगतान करें', 'pay.secured': 'Razorpay द्वारा सुरक्षित।', 'back': 'वापस', 'cancel': 'रद्द करें', 'done': 'हो गया',
  'confirm.title': 'बुकिंग की पुष्टि हुई', 'orders.title': 'मेरे ऑर्डर', 'orders.live': 'लाइव स्थिति', 'refresh': 'रीफ़्रेश', 'updated': 'अपडेट', 'receipt': 'रसीद',
  'profile.title': 'प्रोफ़ाइल', 'profile.bookings': 'मेरी बुकिंग', 'profile.saved': 'सहेजे गए स्थान', 'profile.payments': 'भुगतान के तरीके',
  'profile.language': 'भाषा', 'profile.refer': 'रेफ़र करें और कमाएँ', 'profile.copy': 'कॉपी', 'logout': 'लॉग आउट',
};

const dicts: Record<Lang, Partial<Record<TKey, string>>> = { en, hi };

export const translate = (lang: Lang, k: TKey) => dicts[lang][k] ?? en[k] ?? k;

export function useT() {
  const lang = usePrefsStore((s) => s.lang);
  return (k: TKey) => translate(lang, k);
}
