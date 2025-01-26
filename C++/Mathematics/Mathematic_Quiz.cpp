#include <iostream>
#include <random>
#include <ctime>
#include <string>
#include <limits> // Required for numeric_limits

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

char generateRandomOperator() {
    char operators[] = {'+', '-', '*'};
    return operators[generateRandomNumber(0, 2)];
}

void askQuestion() {
    int num1 = generateRandomNumber(1, 20);
    int num2 = generateRandomNumber(1, 20);
    char op = generateRandomOperator();

    int correctAnswer;
    switch (op) {
        case '+': correctAnswer = num1 + num2; break;
        case '-': correctAnswer = num1 - num2; break;
        case '*': correctAnswer = num1 * num2; break;
        default: cout << "Invalid operator generated.\n"; return;
    }

    cout << "What is " << num1 << " " << op << " " << num2 << "? ";
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

void askAlgebraQuestion() {
    int x = generateRandomNumber(2, 10); // Avoid x=0 to prevent division by zero
    int a = generateRandomNumber(2, 5);
    int b = generateRandomNumber(10, 30);
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

int main() {
    srand(time(0)); // Seed the random number generator
    cout << "Welcome to the Math Quiz!\n";

    int choice;
    do {
        cout << "\nChoose a question type:\n";
        cout << "1. Basic Arithmetic\n";
        cout << "2. Simple Algebra\n";
        cout << "0. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;
                while (cin.fail()) {
        cout << "Invalid input. Please enter a number: ";
        cin.clear();
        clearInputBuffer();
        cin >> choice;
    }

        switch (choice) {
            case 1: askQuestion(); break;
            case 2: askAlgebraQuestion(); break;
            case 0: cout << "Goodbye!\n"; break;
            default: cout << "Invalid choice.\n"; break;
        }
    } while (choice != 0);

    return 0;
}
