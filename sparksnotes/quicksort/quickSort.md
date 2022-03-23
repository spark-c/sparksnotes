# A look at the Lomuto QuickSort algorithm in JavaScript with median-of-three pivot selection

## Benefits/Drawbacks

The Quicksort algorithm is nice because it is... well, "quick", and *also* because it an "in-place" operation; it requires very little additional memory to perform.

There are some cases where it could work in *O*(*n^2*) time, although it can usually be expected to be closer to *O*(*n* log *n*); especially using the "median-of-three" technique that I will describe later.

## Overview

In general, these are the basic steps to the Quicksort algorithm:

1. **Pick** an item from the array you are sorting. This element is called the "Pivot".
1. **Compare** each element to the Pivot.
1. **Swap** elements depending on how they compare to the Pivot value.
    * All items less than the Pivot should end up behind it in the array, and all of those greater than it come after. The array should then have two sides, or "*partitions*", that are separated by the pivot element.
1. **Repeat** the process (recursively) on each of the partitions until the array is sorted.

Take a look at the infographic below to get a sense for how the process flows:

![](Quicksort.png)
> *This graphic was found within another nice Quicksort article [here](https://www.techiedelight.com/quicksort/)!*


### A note:

When we define functions for this algorithm, they should be taking three arguments:
* `arr`: Our complete array of integers to be sorted.
* `start`: The beginning index (inclusive) of the partition to sort.
* `end`: The final index (inclusive) of the partition to sort.

This is important! We are passing these indices each time, because our algorthim will be called recursively several times on several sections of our array. This allows us to work in-place in memory, instead of needing to create many new and/or temporary arrays in the process of the sort.

## 1. Choosing the Pivot

The easiest way to select a pivot element is to simply grab the first or last element of the array; *however*, this runs at a risk! In cases where an array is already sorted, using this method will result in the slowest possible outcome for this algorithm.

You would be better suited to select an element at random; this will usually result in a lower risk of a very long runtime. This option is a nice balance of easy-to-implement and generally lower risk.

But one of the better ways is to use the "**median-of-three**" method. With a tad bit more work, this way approximates a median value for the array -- using this value for the Pivot is more likely to result in a consistent and acceptable running time for the sort.

To get our Pivot value with this method, we will start with the first, middle, and last indexes of our array `arr`.

```javascript
const arr = [ 80, 50, 20, 40, 60, 90, 30, 70, 10 ];
```

Now we will find the median of the values found at those indexes: `arr[0]`, `arr[4]`, and `arr[9]` => `80`, `60`, and `10` => `median: 60`.

And that's it! We can use 60 as our pivot value, and it will be reasonably likely that this value will not lead to *O*(*n^2*) time.

Here is how you might implement this in code:
```javascript
function getMedianOfThree(arr, start, end) {
    const medianArray = [arr[start], arr[Math.floor(arr.length / 2)], arr[end]];
    return medianArray.sort()[1];
}
```


## 2. Comparing elements to the Pivot value / Swapping

Now we need use our pivot value as a reference to help arrange the remaining elements.

[This video](https://www.youtube.com/watch?v=MZaf_9IZCrc) does a great job demonstrating the process visually, and I highly recommend watching!

There will be a few steps to do this:

1. Place the pivot element at the end of the array
1. Create two counter variables, `i` and `j`, whose values will begin at `start - 1` and `start` respectively.
1. Compare the value at `arr[j]` to the pivot value.
    * If `arr[j]` is greater than pivot, simply increment `j` by 1, and begin again.
    * Else, if `arr[j]` is less than pivot, then increment `i` by 1 *and **then*** swap the values found at `arr[j]` and `arr[i]`. Finally, increment `j` by 1. If `i === j`, don't worry; the element does not change and the process can move forward.
1. When `j === end`, swap the pivot value (found at `arr[end]`) with the index `i + 1`. Now, all values before the pivot value should be lesser, and all values to the right of the pivot value should be greater. We've created a new partition on either side of the pivot!
1. Then, call the quicksort function again on both partitions (not including the pivot, which is now already in its correct location):
    ```javascript
    quickSort(arr, start, pivotIndex - 1) // the left partition
    quickSort(arr, pivotIndex + 1, end) // the right partition
    ```



## References

* Video: https://www.youtube.com/watch?v=MZaf_9IZCrc
* Infographic: https://www.techiedelight.com/quicksort/
* General Information: https://en.wikipedia.org/wiki/Quicksort
* Strategies for improving performance: https://www.cs.cornell.edu/courses/JavaAndDS/files/sort3Quicksort3.pdf
* Another nice high-level overview of quicksort and median-of-three: https://stackoverflow.com/a/33979439