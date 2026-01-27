// Rotating daily footer notes for each calculator
// Day-of-year (Sydney timezone) + calculatorId offset determines which note shows

const salaryNotes = [
  'Your salary is a number. Your time is a life.',
  'Every unpaid hour is a silent donation to your employer.',
  'Commute time is work time your payslip forgot.',
  'Recovery time is real time. Your body keeps the receipt.',
  'The gap between your on-paper rate and true rate is where your life leaks.',
  'A raise means less if your hours quietly grew too.',
  'Free overtime is the most expensive thing you give away.',
  'Your contract says 38 hours. Your calendar might disagree.',
  'Work expenses are a pay cut that never shows up on your payslip.',
  'The real question is not what you earn, but what you keep per hour lived.',
  'If your commute doubled, would you still take the job?',
  'Knowing your true rate is not pessimism. It is clarity.',
  'Salary negotiations start with knowing what you actually make.',
  'Time spent thinking about work after hours is still work.',
  'Your lunch break does not count if you eat at your desk.',
  'A high salary with hidden costs is a medium salary in disguise.',
  'The best perk a job can offer is your time back.',
  'Childcare costs are work costs. Count them.',
  'Not all hours are equal, but all of them are yours.',
  'Your employer bought your time. Make sure you know the price.',
  'Burnout is what happens when donated hours compound.',
  'The number on your offer letter is the start of the conversation, not the end.',
  'Remote work does not just save commute time. It returns identity.',
  'Your true hourly rate is the truest measure of a job.',
  'Weekend recovery is a cost of weekday work.',
  'A pay rise that comes with more hours is not always a raise.',
  'Small expenses add up. So do small time losses.',
  'What would you do with ten extra hours a week?',
  'Knowing the real cost helps you negotiate from strength.',
  'Your time has a price. Make sure someone is paying it.',
];

const timeCostNotes = [
  'Every yes is a no to something else.',
  'Hidden time is the part of the commitment that does not make the calendar.',
  'A weekly hour is a full work week per year.',
  'Recovery time is not laziness. It is physics.',
  'The best way to free up time is to stop something, not speed it up.',
  'Small commitments feel light until you stack them.',
  'If it takes more energy than time, it costs more than you think.',
  'One hour a week for a year is two full weeks of your life.',
  'Saying no is a skill that pays in hours.',
  'Prep time, travel time, and wind-down time are all real time.',
  'Not every opportunity is worth the time it asks for.',
  'A monthly commitment adds up faster than it feels.',
  'The calendar lies. It shows duration, not cost.',
  'Before you say yes, ask: what does this actually take?',
  'Fortnightly meetings consume more hours per year than most people guess.',
  'Your future self will thank you for the things you declined.',
  'Time is the one resource you cannot earn back.',
  'The most productive thing you can do is subtract.',
  'If you would not start it today, why continue it tomorrow?',
  'Some yeses protect your time. Most do not.',
  'Energy drain turns a short task into a long recovery.',
  'A full day lost each month is twelve days a year.',
  'Recurring commitments are subscriptions paid in hours.',
  'Your schedule is a portrait of your priorities.',
  'An hour of deep rest can be worth more than an hour of work.',
  'The cost of a commitment is not just the event. It is everything around it.',
  'Busyness is not productivity. Sometimes it is just friction.',
  'Consider the total cost before you commit, not after.',
  'Time you protect is time you get to choose how to spend.',
  'What would your week look like with one fewer obligation?',
];

const frictionNotes = [
  'Friction is invisible until you measure it.',
  'Small daily annoyances are large yearly losses.',
  'The things you tolerate shape the life you live.',
  'Fixing one source of friction can free energy for everything else.',
  'Digital noise is the friction of the modern age.',
  'Your environment is either helping you or taxing you.',
  'Friction does not announce itself. It just slows you down.',
  'The first step to reducing friction is noticing it.',
  'Not all friction is bad, but most of it is unnecessary.',
  'Admin drag is the tax on being a functioning adult.',
  'Schedule overload is a choice disguised as an obligation.',
  'People drain is real. Protect your energy boundaries.',
  'Health friction compounds. Small neglect becomes large cost.',
  'Forty-five minutes lost daily is over eleven full days a year.',
  'The goal is not zero friction. It is awareness of where it lives.',
  'One change in the right place can lower friction everywhere.',
  'Your best leverage point is often the most boring one.',
  'Friction steals motivation before it steals time.',
  'A cluttered environment is a cluttered mind.',
  'Notifications are tiny interruptions with large cumulative cost.',
  'Reducing friction is not about doing more. It is about resisting less.',
  'The simplest systems have the least friction.',
  'What you automate, you never have to decide again.',
  'Friction in the morning sets the tone for the day.',
  'Every workaround you live with is friction you have normalised.',
  'Energy saved on friction is energy available for what matters.',
  'Batching tasks reduces the friction of context switching.',
  'Your biggest friction source is your biggest opportunity.',
  'Sometimes the best improvement is removing something.',
  'Friction is the gap between how things are and how they could be.',
];

const allNotes = [salaryNotes, timeCostNotes, frictionNotes];

export function getDailyNote(calculatorId: number): string {
  // Use Australia/Sydney timezone to determine day-of-year
  const now = new Date();
  const sydneyDate = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
  const startOfYear = new Date(sydneyDate.getFullYear(), 0, 0);
  const diff = sydneyDate.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  const notes = allNotes[calculatorId] ?? salaryNotes;
  return notes[(dayOfYear + calculatorId) % notes.length];
}
