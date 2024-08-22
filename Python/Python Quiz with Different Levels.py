class Quiz:

    def __init__(self):
        self.questions = {
            "Level 1": [
                {
                    "question": "What does the open() function do in Python?",
                    "options": ["Opens a file", "Creates a new file", "Closes a file"],
                    "answer": "Opens a file",
                },
                # Add more questions for Level 1...
            ],
            "Level 2": [
                {
                    "question": "What is the purpose of a try block in exception handling?",
                    "options": [
                        "To handle exceptions",
                        "To raise exceptions",
                        "To define functions",
                    ],
                    "answer": "To handle exceptions",
                },
                # Add more questions for Level 2...
            ],
            # Add more levels...
        }
        self.score = 0

    def display_question(self, level):
        print(f"\n--- {level} ---")
        for q_num, question in enumerate(self.questions[level], start=1):
            print(f"{q_num}. {question['question']}")
            for i, option in enumerate(question["options"], start=1):
                print(f"   {i}. {option}")
            user_answer = input("Your answer (1, 2, 3, ...): ")
            if user_answer == str(question["options"].index(question["answer"]) + 1):
                print("Correct!")
                self.score += 1
            else:
                print(f"Wrong! The correct answer is: {question['answer']}")

    def start_quiz(self):
        print("Welcome to the Python Quiz!")
        for level in self.questions:
            self.display_question(level)
        print(f"\nQuiz completed! Your score: {self.score}/{len(self.questions)}")


if __name__ == "__main__":
    quiz = Quiz()
    quiz.start_quiz()

input("Press Enter to exit")
