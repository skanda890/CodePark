#include <iostream>
#include <asio.hpp> // Asio for networking
#include <future>   // For asynchronous operations
#include <vector>
#include <sstream>
#include <memory>
#include <mutex>

// Custom Allocator (Example - Simple Pool Allocator)
template <typename T>
class PoolAllocator {
private:
    std::vector<T> data;
    std::vector<bool> used;
    std::mutex mutex;

public:
    PoolAllocator(size_t size) : data(size), used(size, false) {}

    T* allocate() {
        std::lock_guard<std::mutex> lock(mutex);
        for (size_t i = 0; i < used.size(); ++i) {
            if (!used[i]) {
                used[i] = true;
                return &data[i];
            }
        }
        return nullptr; // No free blocks
    }

    void deallocate(T* ptr) {
        if (ptr == nullptr) return;
        std::lock_guard<std::mutex> lock(mutex);
        size_t index = ptr - &data[0];
        if (index < used.size()) {
            used[index] = false;
        }
    }
};

// Serializable Data Structure
struct Message {
    std::string content;
    int id;

    template <typename Archive>
    void serialize(Archive& ar) {
        ar(content, id);
    }
};

// Asynchronous Connection Handler
void handleConnection(asio::ip::tcp::socket socket, PoolAllocator<Message>& allocator) {
    try {
        asio::streambuf buffer;
        asio::read_until(socket, buffer, '\n');
        std::istream input(&buffer);
        std::string line;
        std::getline(input, line);

        std::stringstream ss(line);
        Message* msg = allocator.allocate();
        if (msg)
        {
            ss >> msg->content >> msg->id;
            std::cout << "Received: " << msg->content << " ID: " << msg->id << std::endl;
            allocator.deallocate(msg);
        }
        else
            std::cerr << "Failed to allocate memory for message" << std::endl;


        asio::write(socket, asio::buffer("Message Received\n"));
    } catch (std::exception& e) {
        std::cerr << "Exception in connection handler: " << e.what() << std::endl;
    }
}

int main() {
    try {
        asio::io_context io_context;
        asio::ip::tcp::acceptor acceptor(io_context, asio::ip::tcp::endpoint(asio::ip::tcp::v4(), 12345));

        PoolAllocator<Message> messageAllocator(100); // Pool of 100 messages

        for (;;) {
            asio::ip::tcp::socket socket(io_context);
            acceptor.accept(socket);

            // Asynchronous handling of each connection
            std::async(std::launch::async, handleConnection, std::move(socket), std::ref(messageAllocator));
        }
    } catch (std::exception& e) {
        std::cerr << "Exception in main: " << e.what() << std::endl;
    }

    return 0;
}
