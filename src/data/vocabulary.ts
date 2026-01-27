import { Edition } from '../types';
import { book1Units } from './books/book1';
import { book2Units } from './books/book2';
import { book3Units } from './books/book3';
import { book4Units } from './books/book4';
import { book5Units } from './books/book5';
import { book6Units } from './books/book6';
import { collegePandaUnits } from './books/college_panda';

export const editions: Edition[] = [
  {
    id: 1,
    title: "4000 Essential English Words 1",
    description: "Beginner level vocabulary building.",
    color: "from-blue-500 to-cyan-400",
    coverImage: "/covers/book1.svg",
    units: book1Units
  },
  {
    id: 2,
    title: "4000 Essential English Words 2",
    description: "High-beginner vocabulary.",
    color: "from-green-500 to-emerald-400",
    coverImage: "/covers/book2.svg",
    units: book2Units
  },
  {
    id: 3,
    title: "4000 Essential English Words 3",
    description: "Intermediate vocabulary.",
    color: "from-purple-500 to-indigo-400",
    coverImage: "/covers/book3.svg",
    units: book3Units
  },
  {
    id: 4,
    title: "4000 Essential English Words 4",
    description: "Upper-intermediate vocabulary.",
    color: "from-orange-500 to-red-400",
    coverImage: "/covers/book4.svg",
    units: book4Units
  },
  {
    id: 5,
    title: "4000 Essential English Words 5",
    description: "Advanced vocabulary.",
    color: "from-pink-500 to-rose-400",
    coverImage: "/covers/book5.svg",
    units: book5Units
  },
  {
    id: 6,
    title: "4000 Essential English Words 6",
    description: "Mastery level vocabulary.",
    color: "from-yellow-500 to-amber-400",
    coverImage: "/covers/book6.svg",
    units: book6Units
  },
  {
    id: 7,
    title: "The College Panda's 400 SAT Words",
    description: "400 words you must know for the SAT.",
    color: "from-slate-700 to-slate-500",
    coverImage: "/covers/college_panda.svg",
    units: collegePandaUnits
  },
];
