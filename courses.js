/* The course list. To add a course, add one entry here. Nothing else needs to change.

   id           short, unique; used in analytics events (open:<id>)
   title        card heading
   course       the exam it covers (small line under the title)
   subject      Physics | Chemistry | Biology | Math  (sets the icon and the filter chip)
   description  one line
   modules      how many modules the site has (the "Y" in "X of Y done"); null if unknown
   topics       3 to 5 short chips
   url          where the site lives
   status       'live' or 'soon'  (soon = muted, not clickable)
   accent       one hex color; the page darkens it automatically in light mode
   prefix       the site's localStorage prefix
   progressKey  the key holding "marked as done" progress: a JSON object {moduleId: 1}
   label        the GitHub label used in jiacode2030/ap-labs-feedback
*/
window.COURSES = [
  {
    id: 'mechanics',
    title: 'Mechanics Lab',
    course: 'AP Physics C: Mechanics',
    subject: 'Physics',
    description: 'See the motion first: live simulations, worked examples and randomized practice from kinematics to oscillations, plus waves as an extra.',
    modules: 32,
    topics: ['Kinematics', "Newton's laws", 'Energy', 'Rotation', 'Oscillations'],
    url: 'https://jiacode2030.github.io/physics-mechanics/',
    status: 'live',
    accent: '#5CB8FF',
    prefix: 'kin-',
    progressKey: 'kin-done',
    label: 'course:mechanics'
  },
  {
    id: 'em',
    title: 'E&M Lab',
    course: 'AP Physics C: Electricity and Magnetism',
    subject: 'Physics',
    description: 'Fields you can see and move: charges, circuits, magnets and induction, built up one idea at a time.',
    modules: 23,
    topics: ['Electrostatics', "Gauss's law", 'Circuits', 'Magnetism', 'Induction'],
    url: 'https://jiacode2030.github.io/physics-em/',
    status: 'live',
    accent: '#A78BFA',
    prefix: 'eml-',
    progressKey: 'eml-done',
    label: 'course:em'
  },
  {
    id: 'chem',
    title: 'Chemistry Lab',
    course: 'AP Chemistry',
    subject: 'Chemistry',
    description: 'From atoms to equilibrium: particle-level models, interactive graphs and practice with real numbers.',
    modules: 44,
    topics: ['Atomic structure', 'Bonding', 'Kinetics', 'Equilibrium', 'Acids and bases'],
    url: 'https://jiacode2030.github.io/chemistry-lab/',
    status: 'live',
    accent: '#3DD6A3',
    prefix: 'chem-',
    progressKey: 'chem-done',
    label: 'course:chem'
  },
  {
    id: 'calc',
    title: 'Calculus Lab',
    course: 'AP Calculus AB and BC',
    subject: 'Math',
    description: 'Graphs you can drag and zoom, worked examples and randomized practice with exact answers, for AB or BC.',
    modules: 50,
    topics: ['Limits', 'Derivatives', 'Integrals', 'Differential equations', 'Series (BC)'],
    url: 'https://jiacode2030.github.io/calculus-lab/',
    status: 'live',
    accent: '#5FD0DA',
    prefix: 'calc-',
    progressKey: 'calc-done',
    label: 'course:calc'
  }
];
