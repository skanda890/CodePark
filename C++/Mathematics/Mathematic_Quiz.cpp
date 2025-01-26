#include <iostream>
#include <random>
#include <ctime>
#include <string>
#include <vector>
#include <cmath>
#include <limits>
#include <iomanip>
#include <algorithm> // For std::shuffle

using namespace std;

// Function to clear the input buffer
void clearInputBuffer() {
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

int generateRandomNumber(int min, int max) {
    static random_device rd;
    static mt19937 gen(rd());
    uniform_int_distribution<> distrib(min, max);
    return distrib(gen);
}

double generateRandomDouble(double min, double max) {
    static random_device rd;
    static mt19937 gen(rd());
    uniform_real_distribution<> distrib(min, max);
    return distrib(gen);
}

// Question Structure
struct Question {
    string questionText;
    double correctAnswer;
};

// Function to generate arithmetic questions
Question generateArithmeticQuestion(int difficulty) {
    double num1, num2;
    if (difficulty <= 2) {
        num1 = generateRandomNumber(1, 20 * difficulty);
        num2 = generateRandomNumber(1, 10 * difficulty);
    } else {
        num1 = generateRandomDouble(1.0, 10.0 * difficulty);
        num2 = generateRandomDouble(1.0, 5.0 * difficulty);
    }

    char op = (difficulty > 2) ? "+-*/"[generateRandomNumber(0, 3)] : "+-*"[generateRandomNumber(0, 2)];

    double correctAnswer;
    switch (op) {
        case '+': correctAnswer = num1 + num2; break;
        case '-': correctAnswer = num1 - num2; break;
        case '*': correctAnswer = num1 * num2; break;
        case '/':
            while (num2 == 0) num2 = generateRandomDouble(1.0, 5.0 * difficulty);
            correctAnswer = num1 / num2;
            break;
    }
    return {"What is " + to_string(num1) + " " + op + " " + to_string(num2) + "?", correctAnswer};
}

// Function to generate algebra questions
Question generateAlgebraQuestion(int difficulty) {
    int x = generateRandomNumber(2, 5 + difficulty);
    int a = generateRandomNumber(5 * difficulty, 10 * difficulty);
    int b = generateRandomNumber(15 * difficulty, 30 * difficulty);

    while ((b - a) % x != 0) {
        b = generateRandomNumber(15 * difficulty, 30 * difficulty);
    }

    int correctAnswer = (b - a) / x;
    return {"Solve for y: " + to_string(x) + "y + " + to_string(a) + " = " + to_string(b) + "?", correctAnswer};
}

// Function to generate geometry questions
Question generateGeometryQuestion(int difficulty) {
    double radius = generateRandomDouble(1.0 * difficulty, 5.0 * difficulty);
    double area = M_PI * pow(radius, 2);
    return {"What is the area of a circle with radius " + to_string(radius) + "?", area};
}

int main() {
    srand(time(0));
    cout << "Welcome to the Harder Math Quiz!\n";

    int numQuestions = 200;
    vector<Question> questions;

    // Generate all questions up front
    for (int i = 0; i < numQuestions; ++i) {
        int type = generateRandomNumber(1, 3); // 1: Arithmetic, 2: Algebra, 3: Geometry
        int difficulty = generateRandomNumber(1, 5);
        switch (type) {
            case 1: questions.push_back(generateArithmeticQuestion(difficulty)); break;
            case 2: questions.push_back(generateAlgebraQuestion(difficulty)); break;
            case 3: questions.push_back(generateGeometryQuestion(difficulty)); break;
        }
    }

    // Shuffle the questions
    shuffle(questions.begin(), questions.end(), default_random_engine(time(0)));

    int correctAnswers = 0;
    for (int i = 0; i < numQuestions; ++i) {
        cout << "\nQuestion " << (i + 1) << ":\n";
        cout << fixed << setprecision(2);
        cout << questions[i].questionText << " ";

        double userAnswer;
        cin >> userAnswer;
        while (cin.fail()) {
            cout << "Invalid input. Please enter a number: ";
            cin.clear();
            clearInputBuffer();
            cin >> userAnswer;
        }

        if (abs(userAnswer - questions[i].correctAnswer) < 0.01) {
            cout << "Correct!\n";
            correctAnswers++;
        } else {
            cout << "Incorrect. The correct answer is " << questions[i].correctAnswer << ".\n";
        }
    }

    cout << "\nQuiz complete!\n";
    cout << "You scored " << correctAnswers << " out of " << numQuestions << ".\n";

    return 0;
}
