import pygame
pygame.init()

# Set up the display
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("My Game")

# Main game loop
running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill((0, 0, 0))  # Fill the screen with black
    pygame.display.flip()  # Update the display

player = pygame.Rect(100, 100, 50, 50)  # Create a player rectangle

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player.x -= 5
    if keys[pygame.K_RIGHT]:
        player.x += 5

    screen.fill((0, 0, 0))
    pygame.draw.rect(screen, (255, 0, 0), player)  # Draw the player
    pygame.display.flip()

pygame.quit()
