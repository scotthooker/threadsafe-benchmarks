package main

import (
	"fmt"
	"sync"
	"time"
)

var sharedCounter int
var mutex sync.Mutex

func incrementCounter(wg *sync.WaitGroup) {
	defer wg.Done()

	// Simulate some work
	time.Sleep(time.Duration(time.Now().UnixNano()%100) * time.Millisecond)

	mutex.Lock()
	sharedCounter++
	mutex.Unlock()
}

func runBenchmark(numGoroutines int) {
	sharedCounter = 0
	var wg sync.WaitGroup

	startTime := time.Now()

	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go incrementCounter(&wg)
	}

	wg.Wait()

	endTime := time.Now()

	fmt.Printf("Go - Goroutines: %d, Time: %.4fs, Counter: %d\n", numGoroutines, endTime.Sub(startTime).Seconds(), sharedCounter)
}

func main() {
	for _, numGoroutines := range []int{10, 100, 1000} {
		runBenchmark(numGoroutines)
	}
}
