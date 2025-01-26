#include <iostream>
#include <random>
#include <ctime>
#include <string>
#include <vector>
#include <cmath> // For pow, sqrt
#include <limits>
#include <iomanip> // For setprecision

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

char generateRandomOperator(bool includeDivision = true) {
    if (includeDivision) {
        char operators[] = {'+', '-', '*', '/'};
        return operators[generateRandomNumber(0, 3)];
    } else {
        char operators[] = {'+', '-', '*'};
        return operators[generateRandomNumber(0, 2)];
    }
}

void askArithmeticQuestion(int difficulty) {
    double num1, num2;

    if (difficulty <= 2) {
        num1 = generateRandomNumber(1, 20 * difficulty);
        num2 = generateRandomNumber(1, 10 * difficulty);
    } else {
        num1 = generateRandomDouble(1.0, 10.0 * difficulty);
        num2 = generateRandomDouble(1.0, 5.0 * difficulty);
    }

    char op = generateRandomOperator(difficulty > 2);

    double correctAnswer;
    switch (op) {
        case '+': correctAnswer = num1 + num2; break;
        case '-': correctAnswer = num1 - num2; break;
        case '*': correctAnswer = num1 * num2; break;
        case '/':
            if (num2 == 0) { // Avoid division by zero
                cout << "Division by zero is not allowed. Please try a different question.\n";
                return;
            }
            correctAnswer = num1 / num2;
            break;
        default: cout << "Invalid operator generated.\n"; return;
    }

    cout << fixed << setprecision(2); // Set precision for double output
    cout << "What is " << num1 << " " << op << " " << num2 << "? ";
    double userAnswer;
    cin >> userAnswer;
        while (cin.fail()) {
        cout << "Invalid input. Please enter a number: ";
        cin.clear();
        clearInputBuffer();
        cin >> userAnswer;
    }

    if (abs(userAnswer - correctAnswer) < 0.01) { // Check for near equality due to floating-point
        cout << "Correct!\n";
    } else {
        cout << "Incorrect. The correct answer is " << correctAnswer << ".\n";
    }
}

void askAlgebraQuestion(int difficulty) {
    int x = generateRandomNumber(2, 5 + difficulty); // Increase range with difficulty
    int a = generateRandomNumber(5 * difficulty, 10 * difficulty);
    int b = generateRandomNumber(15 * difficulty, 30 * difficulty);

    // Ensure the equation has an integer solution
    if ((b - a) % x != 0) {
        askAlgebraQuestion(difficulty); // Regenerate if not an integer solution
        return;
    }

    int correctAnswer = (b - a) / x;

    cout << "Solve for y: " << x << "y + " << a << " = " << b << "? ";
    int userAnswer;
    cin >> userAnswer;
        while (cin.fail()) {
        cout << "Invalid input. Please enter a number: ";
        cin.clear();
        clearInputBuffer();
        cin >> userAnswer;
    }

    if (userAnswer == correctAnswer) {
        cout << "Correct!\n";
    } else {
        cout << "Incorrect. The correct answer is " << correctAnswer << ".\n";
    }
}

void askGeometryQuestion(int difficulty) {
    double radius = generateRandomDouble(1.0 * difficulty, 5.0 * difficulty);
    double area = M_PI * pow(radius, 2);

    cout << "What is the area of a circle with radius " << radius << "? ";
    double userAnswer;
    cin >> userAnswer;
        while (cin.fail()) {
        cout << "Invalid input. Please enter a number: ";
        cin.clear();
        clearInputBuffer();
        cin >> userAnswer;
    }

    cout << fixed << setprecision(2);
    if (abs(userAnswer - area) < 0.01) {
        cout << "Correct!\n";
    } else {
        cout << "Incorrect. The correct answer is " << area << ".\n";
    }
}

int main() {
    srand(time(0));
    cout << "Welcome to the Harder Math Quiz!\n";

    int choice, difficulty;
    do {
        cout << "\nChoose a question type:\n";
        cout << "1. Basic Arithmetic\n";
        cout << "2. Simple Algebra\n";
        cout << "3. Basic Geometry (Circle Area)\n";
        cout << "0. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;
                while (cin.fail()) {
        cout << "Invalid input. Please enter a number: ";
        cin.clear();
        clearInputBuffer();
        cin >> choice;
    }

        if (choice != 0) {
            cout << "Enter difficulty (1-5, 1 being easiest): ";
            cin >> difficulty;
                        while (cin.fail() || difficulty < 1 || difficulty > 5) {
        cout << "Invalid input. Please enter a number between 1 and 5: ";
        cin.clear();
        clearInputBuffer();
        cin >> difficulty;
    }
        }

        switch (choice) {
            case 1: askArithmeticQuestion(difficulty); break;
            case 2: askAlgebraQuestion(difficulty); break;
            case 3: askGeometryQuestion(difficulty); break;
            case 0: cout << "Goodbye!\n"; break;
            default: cout << "Invalid choice.\n"; break;
        }
    } while (choice != 0);

    return 0;
}
