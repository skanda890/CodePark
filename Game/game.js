import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.KeyEvent;
import java.awt.event.KeyListener;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;

public class CatchGame extends JPanel implements ActionListener, KeyListener {
    private Timer timer;
    private Player player;
    private ArrayList<FallingObject> objects;
    private int score;
    private int level;
    private int missedObjects;
    private boolean powerUpActive;
    private long powerUpEndTime;
    private final int maxMissedObjects = 5;

    public CatchGame() {
        setPreferredSize(new Dimension(800, 600));
        setBackground(Color.LIGHT_GRAY);
        setFocusable(true);
        addKeyListener(this);

        player = new Player(375, 550, 50, 50);
        objects = new ArrayList<>();
        score = 0;
        level = 1;
        missedObjects = 0;
        powerUpActive = false;

        timer = new Timer(10, this);
        timer.start();

        new Timer(1000, e -> createObject()).start();
        new Timer(10000, e -> createPowerUp()).start();
    }

    private void createObject() {
        Random rand = new Random();
        int x = rand.nextInt(750);
        int dy = rand.nextInt(2) + 2;
        Color color = rand.nextDouble() > 0.8 ? Color.GREEN : Color.RED;
        String type = color == Color.GREEN ? "bonus" : "normal";
        objects.add(new FallingObject(x, 0, 20, 20, dy, type, color));
    }

    private void createPowerUp() {
        Random rand = new Random();
        int x = rand.nextInt(750);
        objects.add(new FallingObject(x, 0, 20, 20, 2, "powerUp", Color.YELLOW));
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        player.draw(g);
        for (FallingObject obj : objects) {
            obj.draw(g);
        }
        g.setColor(Color.BLACK);
        g.drawString("Score: " + score, 10, 20);
        g.drawString("Level: " + level, 10, 40);
        g.drawString("Missed: " + missedObjects, 10, 60);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        player.move();
        updateObjects();
        detectCollision();
        increaseDifficulty();
        repaint();
    }

    private void updateObjects() {
        Iterator<FallingObject> iterator = objects.iterator();
        while (iterator.hasNext()) {
            FallingObject obj = iterator.next();
            obj.move();
            if (obj.getY() > getHeight()) {
                missedObjects++;
                iterator.remove();
                if (missedObjects >= maxMissedObjects) {
                    JOptionPane.showMessageDialog(this, "Game Over! Your score: " + score);
                    System.exit(0);
                }
            }
        }
    }

    private void detectCollision() {
        Iterator<FallingObject> iterator = objects.iterator();
        while (iterator.hasNext()) {
            FallingObject obj = iterator.next();
            if (player.getBounds().intersects(obj.getBounds())) {
                iterator.remove();
                if (obj.getType().equals("powerUp")) {
                    powerUpActive = true;
                    powerUpEndTime = System.currentTimeMillis() + 5000;
                } else if (obj.getType().equals("bonus")) {
                    score += 5;
                } else {
                    score++;
                }
            }
        }
    }

    private void increaseDifficulty() {
        if (score % 10 == 0 && score != 0) {
            level++;
            for (FallingObject obj : objects) {
                obj.setDy(obj.getDy() + 1);
            }
        }
    }

    @Override
    public void keyPressed(KeyEvent e) {
        if (e.getKeyCode() == KeyEvent.VK_LEFT) {
            player.setDx(-5);
        } else if (e.getKeyCode() == KeyEvent.VK_RIGHT) {
            player.setDx(5);
        }
    }

    @Override
    public void keyReleased(KeyEvent e) {
        player.setDx(0);
    }

    @Override
    public void keyTyped(KeyEvent e) {}

    public static void main(String[] args) {
        JFrame frame = new JFrame("Catch the Falling Objects Game");
        CatchGame game = new CatchGame();
        frame.add(game);
        frame.pack();
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setVisible(true);
    }
}

class Player {
    private int x, y, width, height, dx;

    public Player(int x, int y, int width, int height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dx = 0;
    }

    public void draw(Graphics g) {
        g.setColor(Color.BLUE);
        g.fillRect(x, y, width, height);
    }

    public void move() {
        x += dx;
        if (x < 0) x = 0;
        if (x + width > 800) x = 800 - width;
    }

    public void setDx(int dx) {
        this.dx = dx;
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }
}

class FallingObject {
    private int x, y, width, height, dy;
    private String type;
    private Color color;

    public FallingObject(int x, int y, int width, int height, int dy, String type, Color color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dy = dy;
        this.type = type;
        this.color = color;
    }

    public void draw(Graphics g) {
        g.setColor(color);
        g.fillRect(x, y, width, height);
    }

    public void move() {
        y += dy;
    }

    public int getY() {
        return y;
    }

    public void setDy(int dy) {
        this.dy = dy;
    }

    public String getType() {
        return type;
    }

    public Rectangle getBounds() {
        return new Rectangle(x, y, width, height);
    }
}
