#include <stdio.h>
#include <stdlib.h>
#include <time.h>

void clearInputBuffer() {
  int c;
  while ((c = getchar()) != '\n' && c != EOF)
    ;
}

void playGame() {
  char *choices[] = {"Rock", "Paper", "Scissors"};
  int userChoice, computerChoice;

  while (1) {
    printf("Choose an option:\n");
    printf("1. Rock\n2. Paper\n3. Scissors\n");
    printf("Enter your choice: ");
    if (scanf("%d", &userChoice) != 1) {
      printf("Invalid choice! Please choose a number between 1 and 3.\n");
      clearInputBuffer();
      continue;
    }

    if (userChoice >= 1 && userChoice <= 3) {
      break;
    } else {
      printf("Invalid choice! Please choose a number between 1 and 3.\n");
    }
  }

  srand(time(0));
  computerChoice = rand() % 3 + 1;

  printf("You chose: %s\n", choices[userChoice - 1]);
  printf("Computer chose: %s\n", choices[computerChoice - 1]);

  if (userChoice == computerChoice) {
    printf("It's a tie!\n");
  } else if ((userChoice == 1 && computerChoice == 3) ||
             (userChoice == 2 && computerChoice == 1) ||
             (userChoice == 3 && computerChoice == 2)) {
    printf("You win!\n");
  } else {
    printf("You lose!\n");
  }
}

int main() {
  playGame();
  return 0;
}
