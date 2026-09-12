import { WordItem } from '../types';

export type LessonKind = 'آ ا' | 'بـ ب' | 'د د' | 'مـ م' | 'سـ س' | 'او و' | 'تـ ت' | 'ر ر' | 'نـ ن' | 'ایـ یـ ی ای' | 'کـ ک' | 'گـ گ' | 'لـ ل' | 'ه ه' | 'پـ پ' | 'جـ ج' | 'چـ چ' | 'شـ ش' | 'فـ ف' | 'ز ز' | 'ژ ژ' | 'خـ خ' | 'قـ ق' | 'غـ غ' | 'عـ ع' | 'حـ ح' | 'ط ط' | 'ظ ظ' | 'ص ص' | 'ض ض' | 'ث ث' | 'ذ ذ';

export interface CurriculumLesson {
  id: string;
  order: number;
  sign: LessonKind;
  letterIds: string[];
  title: string;
  introWords: string[];
  sentenceSeeds: string[];
}

/** ترتیب نشانه‌ها از بسته اول کتاب فارسی اول دبستان، نه ترتیب الفبایی. */
export const CURRICULUM: CurriculumLesson[] = [
  {id:'l01',order:1,sign:'آ ا',letterIds:['alef'],title:'آ مثل آب، ا مثل اَنار',introWords:['آب','اَبر','اَنار'],sentenceSeeds:['آب آمد','آب سرد است']},
  {id:'l02',order:2,sign:'بـ ب',letterIds:['be'],title:'ب مثل بابا و باران',introWords:['بابا','باران','باغ'],sentenceSeeds:['بابا آمد','باران آمد']},
  {id:'l03',order:3,sign:'د د',letterIds:['dal'],title:'د مثل دست و در',introWords:['دست','در','داد'],sentenceSeeds:['بابا آب داد','دست بالا']},
  {id:'l04',order:4,sign:'مـ م',letterIds:['mim'],title:'م مثل مادر و ماه',introWords:['مادر','ماه','مداد'],sentenceSeeds:['مادر آمد','ماه روشن است']},
  {id:'l05',order:5,sign:'سـ س',letterIds:['sin'],title:'س مثل سیب و سارا',introWords:['سیب','سارا','سبد'],sentenceSeeds:['سارا سیب دارد','سیب سرخ است']},
  {id:'l06',order:6,sign:'او و',letterIds:['vav'],title:'و مثل او و توپ',introWords:['او','توپ','توت'],sentenceSeeds:['او توپ دارد','توت شیرین است']},
  {id:'l07',order:7,sign:'تـ ت',letterIds:['te'],title:'ت مثل توت و تاب',introWords:['توت','تاب','تاج'],sentenceSeeds:['توت تازه است','تاج زیبا است']},
  {id:'l08',order:8,sign:'ر ر',letterIds:['re'],title:'ر مثل مادر و باران',introWords:['مادر','باران','پر'],sentenceSeeds:['مادر مهربان است','باران آرام است']},
  {id:'l09',order:9,sign:'نـ ن',letterIds:['noon'],title:'ن مثل نان و نانوا',introWords:['نان','نانوا','انار'],sentenceSeeds:['نان گرم است','نانوا نان دارد']},
  {id:'l10',order:10,sign:'ایـ یـ ی ای',letterIds:['ye'],title:'ی مثل ایران و سیب',introWords:['ایران','سیب','ماهی'],sentenceSeeds:['ایران زیبا است','ماهی در آب است']},
  {id:'l11',order:11,sign:'کـ ک',letterIds:['kaf'],title:'ک مثل کتاب و کودک',introWords:['کتاب','کودک','کلاس'],sentenceSeeds:['کودک کتاب دارد','کلاس شاد است']},
  {id:'l12',order:12,sign:'گـ گ',letterIds:['gaf'],title:'گ مثل گل و گربه',introWords:['گل','گربه','گلابی'],sentenceSeeds:['گل زیبا است','گربه کوچک است']},
  {id:'l13',order:13,sign:'لـ ل',letterIds:['lam'],title:'ل مثل لاله و لیمو',introWords:['لاله','لیمو','لب'],sentenceSeeds:['لاله سرخ است','لیمو ترش است']},
  {id:'l14',order:14,sign:'ه ه',letterIds:['he'],title:'ه مثل خانه و هلو',introWords:['خانه','هلو','همه'],sentenceSeeds:['خانه تمیز است','هلو شیرین است']},
  {id:'l15',order:15,sign:'پـ پ',letterIds:['pe'],title:'پ مثل پروانه و پل',introWords:['پروانه','پل','پدر'],sentenceSeeds:['پروانه زیبا است','پدر آمد']},
  {id:'l16',order:16,sign:'جـ ج',letterIds:['jim'],title:'ج مثل جوجه و جوراب',introWords:['جوجه','جوراب','جام'],sentenceSeeds:['جوجه کوچک است','جوراب نو است']},
  {id:'l17',order:17,sign:'چـ چ',letterIds:['che'],title:'چ مثل چتر و چای',introWords:['چتر','چای','چراغ'],sentenceSeeds:['چتر باز است','چراغ روشن است']},
  {id:'l18',order:18,sign:'شـ ش',letterIds:['shin'],title:'ش مثل شانه و شب',introWords:['شانه','شب','شیر'],sentenceSeeds:['شب آرام است','شیر سفید است']},
  {id:'l19',order:19,sign:'فـ ف',letterIds:['fe'],title:'ف مثل فیل و فرفره',introWords:['فیل','فرفره','فانوس'],sentenceSeeds:['فیل بزرگ است','فرفره می‌چرخد']},
  {id:'l20',order:20,sign:'ز ز',letterIds:['ze'],title:'ز مثل زنبور و زنگ',introWords:['زنبور','زنگ','زمین'],sentenceSeeds:['زنگ صدا دارد','زمین سبز است']},
  {id:'l21',order:21,sign:'ژ ژ',letterIds:['zhe'],title:'ژ مثل مژه',introWords:['مژه','پژمان','لاژورد'],sentenceSeeds:['مژه زیبا است']},
  {id:'l22',order:22,sign:'خـ خ',letterIds:['khe'],title:'خ مثل خانه و خورشید',introWords:['خانه','خورشید','خواب'],sentenceSeeds:['خورشید گرم است','خانه ما زیبا است']},
  {id:'l23',order:23,sign:'قـ ق',letterIds:['ghaf'],title:'ق مثل قایق و قاشق',introWords:['قایق','قاشق','قناری'],sentenceSeeds:['قایق روی آب است','قناری آواز دارد']},
  {id:'l24',order:24,sign:'غـ غ',letterIds:['gheyn'],title:'غ مثل غذا و غاز',introWords:['غذا','غاز','غنچه'],sentenceSeeds:['غذا آماده است','غنچه باز شد']},
  {id:'l25',order:25,sign:'عـ ع',letterIds:['eyn'],title:'ع مثل عروسک و علی',introWords:['عروسک','علی','عینک'],sentenceSeeds:['علی کتاب دارد']},
  {id:'l26',order:26,sign:'حـ ح',letterIds:['he_jimi'],title:'ح مثل حیاط و حوض',introWords:['حیاط','حوض','حسن'],sentenceSeeds:['حیاط تمیز است']},
  {id:'l27',order:27,sign:'ط ط',letterIds:['ta'],title:'ط مثل طوطی و ماهی',introWords:['طوطی','طبل','طلا'],sentenceSeeds:['طوطی سبز است']},
  {id:'l28',order:28,sign:'ظ ظ',letterIds:['za'],title:'ظ مثل ظرف و ظهر',introWords:['ظرف','ظهر','نظافت'],sentenceSeeds:['ظرف تمیز است']},
  {id:'l29',order:29,sign:'ص ص',letterIds:['sad'],title:'ص مثل صابون و صبح',introWords:['صابون','صبح','صدا'],sentenceSeeds:['صبح روشن است']},
  {id:'l30',order:30,sign:'ض ض',letterIds:['zad'],title:'ض مثل رضا و ورزش',introWords:['رضا','ورزش','مریض'],sentenceSeeds:['رضا ورزش می‌کند']},
  {id:'l31',order:31,sign:'ث ث',letterIds:['se_3'],title:'ث مثل ثانیه و مثلث',introWords:['ثانیه','مثلث','کثیف'],sentenceSeeds:['مثلث سه ضلع دارد']},
  {id:'l32',order:32,sign:'ذ ذ',letterIds:['zal'],title:'ذ مثل ذرت و لذت',introWords:['ذرت','لذت','مذرسه'],sentenceSeeds:['ذرت زرد است']}
];

const EASY_SUBJECTS = ['بابا','مادر','سارا','علی','کودک','پرنده','ماهی','گربه'];
const EASY_OBJECTS = ['آب','نان','سیب','کتاب','توپ','گل','توت','مداد'];
const EASY_ADJ = ['خوب است','شاد است','زیبا است','تازه است','گرم است','سرد است','کوچک است','بزرگ است'];
const MEDIUM_VERBS = ['آب دارد','کتاب می‌خواند','به خانه آمد','با مادر است','گل را دید','نان را دوست دارد','در کلاس نشست','به باغ رفت'];
const HARD_CONTEXT = ['امروز کودک با مادر به مدرسه رفت','سارا کتاب فارسی را با شادی خواند','پرنده کوچک روی شاخه درخت نشست','بابا برای کودک یک کتاب زیبا آورد','مادر نان گرم را روی سفره گذاشت','دانش آموز با دقت جمله را خواند','خورشید صبح از پشت کوه بالا آمد','کودکان در حیاط مدرسه بازی کردند'];

export const SENTENCE_DATABASE: string[] = [
  ...CURRICULUM.flatMap(lesson => lesson.sentenceSeeds),
  ...Array.from({length: 180}, (_,i) => `${EASY_SUBJECTS[i%EASY_SUBJECTS.length]} ${EASY_OBJECTS[(i*3)%EASY_OBJECTS.length]}`),
  ...Array.from({length: 180}, (_,i) => `${EASY_SUBJECTS[(i*2)%EASY_SUBJECTS.length]} ${MEDIUM_VERBS[i%MEDIUM_VERBS.length]}`),
  ...Array.from({length: 180}, (_,i) => `${EASY_OBJECTS[i%EASY_OBJECTS.length]} ${EASY_ADJ[(i*3)%EASY_ADJ.length]}`),
  ...Array.from({length: 80}, (_,i) => HARD_CONTEXT[i%HARD_CONTEXT.length])
];

export const SENTENCES_BY_LEVEL = {
  easy: SENTENCE_DATABASE.filter((s,i) => s.split(' ').length <= 3 && i < 220),
  medium: SENTENCE_DATABASE.filter(s => s.split(' ').length >= 3 && s.split(' ').length <= 6),
  hard: SENTENCE_DATABASE.filter(s => s.split(' ').length >= 5)
};

export const lessonForOrder = (order:number) => CURRICULUM.find(lesson => lesson.order === order) || CURRICULUM[0];
