
 /** Approximates the median of a given array of comparables.
 * Accepts: an array, a start index, and end index.
 * Returns: the median value, its index.
 */
function getMedianOfThree(arr, start, end) {
	let middleIndex = Math.floor((start + end) / 2)
	let medianArray = [
		arr[start],
		arr[middleIndex],
		arr[end]
	]

    // Array.prototype.sort() sorts by ASCII value by default,
    // so we pass our own sort function.
	let target = medianArray.sort((a, b) => {return a - b;})[1]
	// See which value was the median, and return that value and its index.
	switch (target) {
		case arr[start]:
			return [arr[start], start]
		case arr[middleIndex]:
			return [arr[middleIndex], middleIndex]
		case arr[end]:
			return [arr[end], end]
	}
}

function swap(arr, i, j) {
	let temp = arr[i];
	arr[i] = arr[j];
	arr[j] = temp;
}

function partition(arr, start, end) {

    // Approximate the median and move that value to the end of the array
	let [ pivot, pivotIndex ] = getMedianOfThree(arr, start, end)
    swap(arr, pivotIndex, end)

	let i = start - 1;
    // For each element until the pivot, beginning with [0]...
	for (let j = start; j <= end - 1; j++) {

		// If current element is smaller than pivot
		if (arr[j] < pivot) {

			// Increment index of counter i
			i++;
            // and swap the values at i and j
			swap(arr, i, j);
		}
	}

    // Swap the pivot value to the spot after i.
	swap(arr, i + 1, end);
    // Now all elements left of pivot are lesser,
    // and all elements right of pivot are greater!

    // Return the index of pivot, which represents the boundary
    // between the left and right partitions
	return i + 1;
}

function quickSort(arr, start, end) {

    // Eventually as the sort progresses, start will == end
    // and our sort will be complete.
    if (start < end){
        let partitionIndex = partition(arr, start, end)

        // Sort both partitions;
        // arr[partitionIndex] is already in the correct place.
        quickSort(arr, start, partitionIndex - 1)
        quickSort(arr, partitionIndex + 1, end)
    }
}

const sortMe = [7,3,8,8,1,63,8,15,2,9,2,7,45,2,9,152,489,126,489,126,948,5,2,7,423,96,24,7,23,49,26,54,23,7,2,79,56,2,52,243,267,23,726,0,459,126,5,2,5,2,786,2,645,423,57,2,5,42,45,5,68,53,486,51,81,5,5,53,853,1,453,53,853,135,531,8,53,13,13,100]

console.log("ready to sort!")

console.log(sortMe)

quickSort(sortMe, 0, sortMe.length - 1)

console.log("sorted!")

console.log(sortMe)