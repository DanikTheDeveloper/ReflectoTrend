package main

import (
	"fmt"
	"reflecto.trend/shares"
)

func main() {
	fmt.Println("Starting stock update process...")
	
	err := shares.StockUpdateAll()
	if err != nil {
		fmt.Printf("Error updating stocks: %v\n", err)
		return
	}
	
	fmt.Println("Stock update completed successfully")
}
