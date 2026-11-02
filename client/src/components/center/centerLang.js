import { useSyncExternalStore } from "react";

const KEY = "centerLang";
const listeners = new Set();

const readLang = () => {
  try {
    return localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch (error) {
    return "en";
  }
};

let current = readLang();

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => current;

export function toggleLang() {
  current = current === "en" ? "ar" : "en";
  try {
    localStorage.setItem(KEY, current);
  } catch (error) {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

const dict = {
  en: {
    language: "Language",
    centerPanel: "Center Panel",
    dashboard: "Dashboard",
    profile: "Profile",
    management: "Management",
    refundRequests: "Refund Requests",
    addTreatment: "Add Treatment",
    editTreatment: "Edit Treatment",
    managementAppointments: "Management Appointments",
    logout: "Logout",

    serverError: "Server Error",
    loading: "Loading...",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    add: "Add",
    remove: "Remove",
    reset: "Reset",
    omr: "OMR",
    service: "Service",
    total: "Total",

    m1: "Jan", m2: "Feb", m3: "Mar", m4: "Apr", m5: "May", m6: "Jun",
    m7: "Jul", m8: "Aug", m9: "Sep", m10: "Oct", m11: "Nov", m12: "Dec",
    d0: "Sun", d1: "Mon", d2: "Tue", d3: "Wed", d4: "Thu", d5: "Fri", d6: "Sat",

    centerDashboard: "Center Dashboard",
    totalBooking: "Total Booking",
    reviews: "Reviews",
    noReviews: "No reviews yet",
    servicesAnalysis: "Services Analysis Per Month",
    monthlyBookings: "Monthly Bookings ({year})",
    year: "Year:",
    date: "Date:",
    noBookings: "No bookings found.",
    bookings: "Bookings",
    bookingsLbl: "Bookings:",
    revenueLbl: "Revenue:",
    revenueCol: "Revenue",
    noDataYear: "No data for this year.",

    centerManagement: "Center Management",
    myTreatments: "My Treatments",
    noTreatments: "No treatments yet.",
    addNewTreatment: "Add New Treatment",
    confirmDelete: 'Are you sure you want to delete "{name}"?',

    centerProfile: "Center Profile",
    centerName: "Center Name",
    email: "Email Address",
    phone: "Phone Number",
    enterPhone: "Enter Phone Number",
    imageLink: "Upload Image Link",
    locations: "Locations",
    locationNamePh: "Location name (e.g. Al Seeb Branch)",
    mapLinkPh: "Map link (https://maps.google.com/...)",
    addLocation: "+ Add Another Location",
    description: "Description",
    aboutPh: "About your center...",
    saveChanges: "Save Changes",
    savedOk: "Changes saved successfully!",
    locIncomplete: "Each location needs both a name and a map link.",
    locBadLink: "Map link must start with http:// or https://",

    updateTreatment: "Update Treatment",
    treatmentName: "Treatment Name",
    nameExample: "Hijama (cupping Therapy)",
    priceOmr: "Price (OMR)",
    durationMin: "Duration (min)",
    category: "Category",
    catTherapy: "Therapy",
    catMassage: "Massage",
    catHijama: "Hijama",
    location: "Location",
    locationPh: "Muscat",
    descPh: "Enter description here...",
    addedOk: "Treatment added successfully!",
    updatedOk: "Treatment updated successfully!",
    loginFirst: "Please login first",
    selectDay: "Select at least one working day",
    confirmCancelEdit: "Are you sure you want to cancel? Unsaved changes will be lost.",

    workingDays: "Working Days",
    dailySlots: "Daily Time Slots ({n} per day)",
    to: "to",
    doctorName: "Doctor name",
    addSlot: "+ Add Time Slot",

    updateCancelTitle: "Update and Cancel Appointment",
    refresh: "Refresh",
    noAppointments: "No appointments found.",
    timeLbl: "Time",
    priceLbl: "Price",
    dateLbl: "Date",
    customerApproval: "Customer Approval",
    statusWaiting: "Waiting for the customer to approve the {type}...",
    statusApproved: "Customer approved the {type}",
    statusRejected: "Customer rejected the request",
    statusNone: "No permission requested yet",
    reqEdit: "Request Edit Permission",
    reqCancel: "Request Cancel Permission",
    typeEdit: "edit",
    typeCancel: "cancel",
    confirmRequest: "Send a {type} permission request to {name}?",
    confirmCancelAppt: "Are you sure you want to cancel this appointment?",

    updateApptTitle: "Update Appointment Date",
    customerC: "Customer:",
    serviceC: "Service:",
    doctorC: "Doctor:",
    timeC: "Time:",
    priceC: "Price:",
    currentDate: "Current date:",
    newDate: "New Appointment Date",
    hintDate:
      "* The new date must be one of the treatment's working days and the same time slot must be free.",
    saveNewDate: "Save New Date",
    differentDate: "Choose a different date from the current one.",
    checking: "Checking availability...",
    closedDay: "The center is closed on this day.",
    slotGone: "This time slot no longer exists.",
    slotBooked: "This slot is already booked by another customer.",
    available: "Available: {start} - {end} with {doctor}",
    selectDate: "Please select a date",
    dateUpdated: "Appointment date updated successfully!",

    refundTitle: "Refund Requests Approval",
    apptC: "Appointment:",
    reasonC: "Reason:",
    approve: "Approve",
    reject: "Reject",
    approvedMsg: "Request Approved. A notification has been sent to the user.",
    rejectedMsg: "Request Rejected. A notification has been sent to the user.",
    noPending: "No pending refund requests.",
    confirmApprove: "Are you sure you want to approve this refund request?",
    confirmReject: "Are you sure you want to reject this refund request?",
  },

  ar: {
    language: "اللغة",
    centerPanel: "لوحة المركز",
    dashboard: "لوحة التحكم",
    profile: "الملف الشخصي",
    management: "الإدارة",
    refundRequests: "طلبات الاسترجاع",
    addTreatment: "إضافة علاج",
    editTreatment: "تعديل علاج",
    managementAppointments: "إدارة المواعيد",
    logout: "تسجيل الخروج",

    serverError: "خطأ في الخادم",
    loading: "جارٍ التحميل...",
    edit: "تعديل",
    delete: "حذف",
    cancel: "إلغاء",
    save: "حفظ",
    add: "إضافة",
    remove: "إزالة",
    reset: "إعادة ضبط",
    omr: "ر.ع",
    service: "الخدمة",
    total: "المجموع",

    m1: "يناير", m2: "فبراير", m3: "مارس", m4: "أبريل", m5: "مايو", m6: "يونيو",
    m7: "يوليو", m8: "أغسطس", m9: "سبتمبر", m10: "أكتوبر", m11: "نوفمبر", m12: "ديسمبر",
    d0: "الأحد", d1: "الاثنين", d2: "الثلاثاء", d3: "الأربعاء", d4: "الخميس", d5: "الجمعة", d6: "السبت",

    centerDashboard: "لوحة تحكم المركز",
    totalBooking: "إجمالي الحجوزات",
    reviews: "التقييمات",
    noReviews: "لا توجد تقييمات بعد",
    servicesAnalysis: "تحليل الخدمات الشهري",
    monthlyBookings: "الحجوزات الشهرية ({year})",
    year: "السنة:",
    date: "التاريخ:",
    noBookings: "لا توجد حجوزات.",
    bookings: "الحجوزات",
    bookingsLbl: "الحجوزات:",
    revenueLbl: "الإيراد:",
    revenueCol: "الإيراد",
    noDataYear: "لا توجد بيانات لهذه السنة.",

    centerManagement: "إدارة المركز",
    myTreatments: "علاجاتي",
    noTreatments: "لا توجد علاجات بعد.",
    addNewTreatment: "إضافة علاج جديد",
    confirmDelete: 'هل أنت متأكد من حذف "{name}"؟',

    centerProfile: "ملف المركز",
    centerName: "اسم المركز",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    enterPhone: "أدخل رقم الهاتف",
    imageLink: "رابط الصورة",
    locations: "المواقع",
    locationNamePh: "اسم الموقع (مثال: فرع السيب)",
    mapLinkPh: "رابط الخريطة (https://maps.google.com/...)",
    addLocation: "+ إضافة موقع آخر",
    description: "الوصف",
    aboutPh: "نبذة عن مركزك...",
    saveChanges: "حفظ التغييرات",
    savedOk: "تم حفظ التغييرات بنجاح!",
    locIncomplete: "كل موقع يحتاج اسماً ورابط خريطة.",
    locBadLink: "يجب أن يبدأ رابط الخريطة بـ http:// أو https://",

    updateTreatment: "تعديل العلاج",
    treatmentName: "اسم العلاج",
    nameExample: "الحجامة",
    priceOmr: "السعر (ر.ع)",
    durationMin: "المدة (دقيقة)",
    category: "التصنيف",
    catTherapy: "علاج",
    catMassage: "مساج",
    catHijama: "حجامة",
    location: "الموقع",
    locationPh: "مسقط",
    descPh: "اكتب الوصف هنا...",
    addedOk: "تمت إضافة العلاج بنجاح!",
    updatedOk: "تم تحديث العلاج بنجاح!",
    loginFirst: "الرجاء تسجيل الدخول أولاً",
    selectDay: "اختر يوم عمل واحداً على الأقل",
    confirmCancelEdit: "هل أنت متأكد من الإلغاء؟ ستفقد التغييرات غير المحفوظة.",

    workingDays: "أيام العمل",
    dailySlots: "المواعيد اليومية ({n} في اليوم)",
    to: "إلى",
    doctorName: "اسم الدكتور",
    addSlot: "+ إضافة موعد",

    updateCancelTitle: "تعديل وإلغاء المواعيد",
    refresh: "تحديث",
    noAppointments: "لا توجد مواعيد.",
    timeLbl: "الوقت",
    priceLbl: "السعر",
    dateLbl: "التاريخ",
    customerApproval: "موافقة العميل",
    statusWaiting: "بانتظار موافقة العميل على {type}...",
    statusApproved: "وافق العميل على {type}",
    statusRejected: "رفض العميل الطلب",
    statusNone: "لم يتم طلب إذن بعد",
    reqEdit: "طلب إذن التعديل",
    reqCancel: "طلب إذن الإلغاء",
    typeEdit: "التعديل",
    typeCancel: "الإلغاء",
    confirmRequest: "إرسال طلب إذن {type} إلى {name}؟",
    confirmCancelAppt: "هل أنت متأكد من إلغاء هذا الموعد؟",

    updateApptTitle: "تعديل تاريخ الموعد",
    customerC: "العميل:",
    serviceC: "الخدمة:",
    doctorC: "الدكتور:",
    timeC: "الوقت:",
    priceC: "السعر:",
    currentDate: "التاريخ الحالي:",
    newDate: "تاريخ الموعد الجديد",
    hintDate:
      "* يجب أن يكون التاريخ الجديد من أيام عمل العلاج، وأن يكون نفس الموعد متاحاً.",
    saveNewDate: "حفظ التاريخ الجديد",
    differentDate: "اختر تاريخاً مختلفاً عن التاريخ الحالي.",
    checking: "جارٍ التحقق من التوفر...",
    closedDay: "المركز مغلق في هذا اليوم.",
    slotGone: "هذا الموعد لم يعد موجوداً.",
    slotBooked: "هذا الموعد محجوز لعميل آخر.",
    available: "متاح: {start} - {end} مع {doctor}",
    selectDate: "الرجاء اختيار تاريخ",
    dateUpdated: "تم تحديث تاريخ الموعد بنجاح!",

    refundTitle: "الموافقة على طلبات الاسترجاع",
    apptC: "الموعد:",
    reasonC: "السبب:",
    approve: "موافقة",
    reject: "رفض",
    approvedMsg: "تمت الموافقة على الطلب. تم إرسال إشعار للعميل.",
    rejectedMsg: "تم رفض الطلب. تم إرسال إشعار للعميل.",
    noPending: "لا توجد طلبات استرجاع معلّقة.",
    confirmApprove: "هل أنت متأكد من الموافقة على طلب الاسترجاع؟",
    confirmReject: "هل أنت متأكد من رفض طلب الاسترجاع؟",

    // messages coming from the server
    "srv:Add at least one time slot": "أضف موعداً واحداً على الأقل",
    "srv:Invalid time format": "صيغة الوقت غير صحيحة",
    "srv:Slot end time must be after start time": "يجب أن يكون وقت النهاية بعد وقت البداية",
    "srv:Each slot needs a doctor name": "كل موعد يحتاج اسم دكتور",
    "srv:Customer approval required": "موافقة العميل مطلوبة",
    "srv:The center is closed on this day": "المركز مغلق في هذا اليوم",
    "srv:This slot is already booked on that date": "هذا الموعد محجوز في ذلك التاريخ",
    "srv:Invalid date": "تاريخ غير صحيح",
    "srv:Treatment not found": "العلاج غير موجود",
    "srv:Booking not found": "الحجز غير موجود",
    "srv:Refund request not found": "طلب الاسترجاع غير موجود",
    "srv:This request was already answered": "تم الرد على هذا الطلب مسبقاً",
    "srv:Center not found": "المركز غير موجود",
  },
};

export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot);

  // t("key", { name: "x" }) replaces {name} inside the text
  const t = (key, vars) => {
    let text = dict[lang][key] ?? dict.en[key] ?? key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        text = text.split(`{${k}}`).join(vars[k]);
      });
    }
    return text;
  };

  // translates known server messages, leaves the others as they are
  const ts = (message) => dict[lang]["srv:" + message] ?? message;

  return { lang, t, ts, toggleLang, isAr: lang === "ar" };
}