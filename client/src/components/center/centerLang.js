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
    doctors: "Doctors",
    management: "Appointment Management",
    refundRequests: "Refund Requests",
    addTreatment: "Add Treatment",
    editTreatment: "Edit Treatment",
    managementAppointments: "Bookings Management",
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

    centerManagement: "Appointment Management",
    myTreatments: "Center Available Treatment",
    noTreatments: "No treatments yet.",
    addNewTreatment: "Treatment Management",
    confirmDelete: 'Are you sure you want to delete "{name}"?',

    centerProfile: "Center Profile",
    centerName: "Center Name",
    email: "Email Address",
    phone: "Phone Number",
    enterPhone: "Enter Phone Number",
    imageLink: "Upload Image Link",
    centerImage: "Center Image",
    treatmentImage: "Treatment Image",
    chooseImage: "Choose image from device",
    changeImage: "Change image",
    removeImage: "Remove image",
    noImage: "No image selected",
    processingImage: "Processing image...",
    imageHint: "JPG, PNG or WEBP. The image is resized automatically.",
    imageNotImage: "Please choose an image file (JPG, PNG or WEBP).",
    imageTooBig: "This image is too large. Choose a smaller image.",
    imageReadError: "Could not read this image. Try another one.",
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
    dayHas: "Appointments available",
    dayNone: "No appointments",
    dailySlots: "Daily Time Slots ({n} per day)",
    slotsEndHint:
      "The end time is calculated automatically: start time + treatment duration. Keep at least 5 minutes between any two slots.",
    slotEnd: "End time (automatic)",
    slotsNeedDuration: "Enter the treatment duration first, so the end time of each slot can be calculated.",
    slotsGap: "There must be at least 5 minutes between any two time slots.",
    slotPastMidnight: "A slot ends after midnight. Choose an earlier start time.",
    slotNeedStart: "Set a start time for every slot.",
    slotNeedDoctor: "Choose a doctor for every slot.",
    needSlot: "Add at least one time slot.",
    to: "to",
    doctorName: "Doctor name",
    addSlot: "+ Add Time Slot",
    selectDoctor: "Select doctor",
    noDoctorsForSlots: "You have not registered any doctors yet. Add your doctors first, then create the time slots.",
    goAddDoctors: "Go to Doctors page",
    notRegistered: "not registered",

    doctorsTitle: "Center Doctors",
    doctorNameLbl: "Doctor Name",
    doctorNamePh: "e.g. Dr. Aisha Al-Hadhrami",
    specialty: "Specialty (optional)",
    specialtyPh: "e.g. Cupping therapy",
    addDoctor: "Add Doctor",
    myDoctors: "Registered Doctors",
    noDoctors: "No doctors registered yet.",
    confirmDeleteDoctor: 'Delete doctor "{name}"?',

    updateCancelTitle: "Update and Cancel Appointment",
    refresh: "Refresh",
    noAppointments: "No appointments found.",
    timeLbl: "Time",
    priceLbl: "Price",
    dateLbl: "Date",
    doctorLbl: "Doctor",
    phonePermission: "I received the customer's permission by phone",
    phoneHint: "Call the customer and get their permission before editing or cancelling this appointment.",
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
    doctors: "الأطباء",
    management: "إدارة المواعيد",
    refundRequests: "طلبات الاسترجاع",
    addTreatment: "إضافة علاج",
    editTreatment: "تعديل علاج",
    managementAppointments: "إدارة الحجوزات",
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

    centerManagement: "إدارة المواعيد",
    myTreatments: "العلاجات المتاحة في المركز",
    noTreatments: "لا توجد علاجات بعد.",
    addNewTreatment: "إدارة العلاجات",
    confirmDelete: 'هل أنت متأكد من حذف "{name}"؟',

    centerProfile: "ملف المركز",
    centerName: "اسم المركز",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    enterPhone: "أدخل رقم الهاتف",
    imageLink: "رابط الصورة",
    centerImage: "صورة المركز",
    treatmentImage: "صورة العلاج",
    chooseImage: "اختيار صورة من الجهاز",
    changeImage: "تغيير الصورة",
    removeImage: "إزالة الصورة",
    noImage: "لم يتم اختيار صورة",
    processingImage: "جارٍ معالجة الصورة...",
    imageHint: "JPG أو PNG أو WEBP. يتم تصغير الصورة تلقائياً.",
    imageNotImage: "الرجاء اختيار ملف صورة (JPG أو PNG أو WEBP).",
    imageTooBig: "حجم هذه الصورة كبير جداً. اختر صورة أصغر.",
    imageReadError: "تعذّرت قراءة هذه الصورة. جرّب صورة أخرى.",
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
    dayHas: "يوجد موعد",
    dayNone: "لا يوجد موعد",
    dailySlots: "المواعيد اليومية ({n} في اليوم)",
    slotsEndHint:
      "وقت النهاية يُحسب تلقائياً: وقت البداية + مدة العلاج. اترك 5 دقائق على الأقل بين أي موعدين.",
    slotEnd: "وقت النهاية (تلقائي)",
    slotsNeedDuration: "أدخل مدة العلاج أولاً ليتم حساب وقت نهاية كل موعد.",
    slotsGap: "يجب أن يكون بين أي موعدين 5 دقائق على الأقل.",
    slotPastMidnight: "أحد المواعيد ينتهي بعد منتصف الليل. اختر وقت بداية أبكر.",
    slotNeedStart: "حدد وقت بداية لكل موعد.",
    slotNeedDoctor: "اختر دكتوراً لكل موعد.",
    needSlot: "أضف موعداً واحداً على الأقل.",
    to: "إلى",
    doctorName: "اسم الدكتور",
    addSlot: "+ إضافة موعد",
    selectDoctor: "اختر الدكتور",
    noDoctorsForSlots: "لم تسجّل أي أطباء بعد. سجّل أطباءك أولاً ثم أنشئ المواعيد.",
    goAddDoctors: "الذهاب لصفحة الأطباء",
    notRegistered: "غير مسجّل",

    doctorsTitle: "أطباء المركز",
    doctorNameLbl: "اسم الدكتور",
    doctorNamePh: "مثال: د. عائشة الحضرمي",
    specialty: "التخصص (اختياري)",
    specialtyPh: "مثال: العلاج بالحجامة",
    addDoctor: "إضافة دكتور",
    myDoctors: "الأطباء المسجلون",
    noDoctors: "لا يوجد أطباء مسجلون بعد.",
    confirmDeleteDoctor: 'هل تريد حذف الدكتور "{name}"؟',

    updateCancelTitle: "تعديل وإلغاء المواعيد",
    refresh: "تحديث",
    noAppointments: "لا توجد مواعيد.",
    timeLbl: "الوقت",
    priceLbl: "السعر",
    dateLbl: "التاريخ",
    doctorLbl: "الدكتور",
    phonePermission: "حصلت على موافقة العميل عبر الاتصال",
    phoneHint: "اتصل بالعميل وخذ موافقته قبل تعديل هذا الموعد أو إلغائه.",
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
    "srv:Invalid image": "الصورة غير صالحة. اختر صورة JPG أو PNG أو WEBP",
    "srv:Image is too large": "حجم الصورة كبير جداً. اختر صورة أصغر",
    "srv:Add at least one time slot": "أضف موعداً واحداً على الأقل",
    "srv:Invalid time format": "صيغة الوقت غير صحيحة",
    "srv:Slot end time must be after start time": "يجب أن يكون وقت النهاية بعد وقت البداية",
    "srv:Slot length must match the treatment duration": "مدة الموعد يجب أن تطابق مدة العلاج",
    "srv:Time slots must be at least 5 minutes apart": "يجب أن يكون بين أي موعدين 5 دقائق على الأقل",
    "srv:Each slot needs a doctor name": "كل موعد يحتاج اسم دكتور",
    "srv:Choose a doctor from your registered doctors": "اختر دكتوراً من الأطباء المسجلين في مركزك",
    "srv:This doctor is already registered": "هذا الدكتور مسجّل مسبقاً",
    "srv:This doctor is used in a treatment schedule": "هذا الدكتور مستخدم في جدول علاج. غيّر الجدول أولاً",
    "srv:Doctor name is required": "اسم الدكتور مطلوب",
    "srv:Doctor not found": "الدكتور غير موجود",
    "srv:Invalid center": "مركز غير صحيح",
    "srv:Customer approval required": "موافقة العميل مطلوبة",
    "srv:This booking does not belong to your center": "هذا الحجز لا يتبع مركزك",
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