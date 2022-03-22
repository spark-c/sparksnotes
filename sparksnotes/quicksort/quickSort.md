# A look at the Lomuto QuickSort algorithm in JavaScript with median-of-three partition selection

## Benefits/Drawbacks

The Quicksort algorithm is nice because it is... well, "quick", and *also* because it an "in-place" operation; it requires very little additional memory to perform.

There are some cases where it could work in *O*(*n^2*) time, although it can usually be expected to be closer to *O*(*n* log *n*); especially using the "median-of-three" technique that I will describe later.

## Overview

In general, these are the basic steps to the Quicksort algorithm:

1. **Pick** an item from the array you are sorting. This element is called the "Pivot".
1. **Compare** each element to the Pivot.
1. **Swap** elements depending on how they compare to the Pivot value.
    * All items less than the Pivot should end up behind it in the array, and all of those greater than it come after. The array should then have two sides, or "*partitions*", that are separated by the pivot element.
1. **Repeat** the process on each of the partitions until the array is sorted.

Take a look at the infographic below to get a sense for how the process flows:

![](Quicksort.png)
> *This graphic was found within another nice Quicksort article [here](https://www.techiedelight.com/quicksort/)!*


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


## 2. Comparing elements to the Pivot value