#include <iostream>
#include <limits> // Required for numeric_limits
#include <string>
#include <vector>

using namespace std;

// Function to clear the input buffer
void clearInputBuffer() { cin.ignore(numeric_limits<streamsize>::max(), '\n'); }

void printIntroduction() {
  cout << "Welcome to C++ Learning Adventure!\n";
  cout << "I'm your friendly coding guide. Let's learn to code together!\n\n";
}

void learnVariables() {
  cout << "Let's learn about variables!\n";
  cout << "Variables are like containers that store information.\n";
  cout << "For example, we can store numbers, words, and more!\n\n";

  cout << "Let's create a variable to store your age:\n";
  int age;
  cout << "Enter your age: ";
  cin >> age;
  while (cin.fail()) {
    cout << "Invalid input. Please enter a number: ";
    cin.clear();
    clearInputBuffer();
    cin >> age;
  }
  cout << "Great! You are " << age << " years old.\n\n";

  cout << "Now, let's store your name:\n";
  string name;
  cout << "Enter your name: ";
  clearInputBuffer();
  getline(cin, name);
  cout << "Hello, " << name << "! It's nice to meet you.\n\n";
}

void learnOutput() {
  cout << "Now, let's learn how to make the computer talk to us!\n";
  cout << "We use 'cout' to display text on the screen.\n";
  cout << "Try typing this: cout << \"Hello, world!\";\n";
  cout << "It will print 'Hello, world!' on the screen.\n\n";

  cout << "Let's try an example:\n";
  string message;
  cout << "Enter a message you want to display: ";
  clearInputBuffer();
  getline(cin, message);
  cout << "You typed: " << message << endl;
  cout << "See? The computer repeated your message!\n\n";
}

void learnInput() {
  cout << "Great! Now let's learn how to get information from the user.\n";
  cout << "We use 'cin' to read input from the keyboard.\n";
  cout << "Let's ask the user for their favorite number:\n";

  int favNum;
  cout << "What is your favorite number? ";
  cin >> favNum;
  while (cin.fail()) {
    cout << "Invalid input. Please enter a number: ";
    cin.clear();
    clearInputBuffer();
    cin >> favNum;
  }
  cout << "Your favorite number is " << favNum << ". Cool!\n\n";
}

void learnIfStatements() {
  cout << "Let's learn about making decisions with 'if' statements!\n";
  cout << "An 'if' statement lets the computer do different things based on "
          "whether a condition is true or false.\n";

  int age;
  cout << "Enter your age: ";
  cin >> age;
  while (cin.fail()) {
    cout << "Invalid input. Please enter a number: ";
    cin.clear();
    clearInputBuffer();
    cin >> age;
  }

  if (age >= 13) {
    cout << "You are a teenager!\n";
  } else {
    cout << "You are a child!\n";
  }
  cout << "Try changing the age to see what happens!\n\n";
}

int main() {
  printIntroduction();

  int choice;
  do {
    cout << "What do you want to learn?\n";
    cout << "1. Variables\n";
    cout << "2. Output (cout)\n";
    cout << "3. Input (cin)\n";
    cout << "4. If Statements\n";
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
    case 1:
      learnVariables();
      break;
    case 2:
      learnOutput();
      break;
    case 3:
      learnInput();
      break;
    case 4:
      learnIfStatements();
      break;
    case 0:
      cout << "Goodbye! Keep coding!\n";
      break;
    default:
      cout << "Invalid choice. Please try again.\n";
      break;
    }
  } while (choice != 0);

  return 0;
}
