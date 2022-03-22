# A look at the Lomuto QuickSort algorithm in JavaScript with median-of-three partition selection

In general, there are three steps to the Quicksort algorithm:

1. Pick an item from the array you are sorting. This element is called the "Pivot".
2. Reorder the array so that all items less than the Pivot come before it in the array, and all of those greater than it come after. Now the array has two sides, or "partitions", that are separated by the pivot element.
3. Repeat the process on each of the partitions until the array is sorted.

![](Quicksort.png)
> Infographic can be found within another nice Quicksort article [here](https://www.techiedelight.com/quicksort/)!