import threading
import time
import random

# A shared resource to test thread safety
shared_counter = 0
lock = threading.Lock()

def increment_counter():
    global shared_counter
    # Simulate some work
    time.sleep(random.random() * 0.1)
    with lock:
        shared_counter += 1

def run_benchmark(num_threads):
    global shared_counter
    shared_counter = 0
    threads = []

    start_time = time.time()

    # Create and start threads
    for _ in range(num_threads):
        thread = threading.Thread(target=increment_counter)
        thread.start()
        threads.append(thread)

    # Wait for all threads to complete
    for thread in threads:
        thread.join()

    end_time = time.time()

    print(f"Python - Threads: {num_threads}, Time: {end_time - start_time:.4f}s, Counter: {shared_counter}")

if __name__ == "__main__":
    for num_threads in [10, 100, 1000]:
        run_benchmark(num_threads)