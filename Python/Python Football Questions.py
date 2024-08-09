print('Welcome to AskPython Quiz')
answer = input('Are you ready to play the Quiz? (yes/no): ')

if answer.lower() == 'yes':
    score = 0
    total_questions = 7

    answer = input('Question 1: Who played football in Real Madrid in the 2014 season? ')
    if answer.lower() == 'Ronaldo':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 2: Which country won the FIFA World Cup in 2018? ')
    if answer.lower() == 'France':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 3: Who is known as the "King of Football"? ')
    if answer.lower() == 'Pele':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 4: Which player has won the most Ballon d'Or awards? ')
    if answer.lower() == 'Lionel Messi':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 5: Which country has won the most FIFA World Cups? ')
    if answer.lower() == 'Brazil':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 6: Who scored the "Hand of God" goal in the 1986 World Cup? ')
    if answer.lower() == 'Diego Maradona':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    answer = input('Question 7: Which club has won the most UEFA Champions League titles? ')
    if answer.lower() == 'Real Madrid':
        score += 1
        print('Correct!')
    else:
        print('Wrong answer!')

    print(f'Thank you for playing! You attempted {score} questions correctly.')
    mark = (score / total_questions) * 100
    print(f'Marks obtained: {mark:.1f}%')
else:
    print('Goodbye!')
