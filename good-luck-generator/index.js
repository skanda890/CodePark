import axios from 'axios';
import chalk from 'chalk';

const affirmations = [
    "Today is your lucky day!",
    "Good things are coming your way.",
    "You have the power to change your life.",
    "Believe in yourself and all that you are.",
    "Positivity attracts positivity.",
    "Success is in your future.",
    "You are capable of amazing things.",
    "Great things never come from comfort zones.",
    "Dream big and dare to fail.",
    "Your potential is limitless."
];

const getDailyAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    return affirmations[randomIndex];
};

const displayAffirmation = () => {
    const affirmation = getDailyAffirmation();
    console.log(chalk.greenBright(affirmation));
};

displayAffirmation();
