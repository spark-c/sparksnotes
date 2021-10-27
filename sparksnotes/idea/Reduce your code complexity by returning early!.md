#blog #idea

Also, since your mentor mentioned this, I wanted to point it out b/c this code pattern can be very helpful to keep your code clean:

> "consider reducing the if/else statement to an if statement only"

I will show you what they mean:

```
# currently:
def distance(strand_a, strand_b):
    count=0
    if len(strand_a)==len(strand_b):
        for x in range(len(strand_a)):
            if strand_a[x]!=strand_b[x]:
                count+=1
        return count
    else:
        raise Exception("strands are not equal in length")

# simplified
def distance(strand_a, strand_b):
    if len(strand_a) != len(strand_b):
        raise Exception("strands are not equal in length")
    
    count=0
    for x in range(len(strand_a)):
        if strand_a[x]!=strand_b[x]:
            count+=1

    return count
```

Above, I moved the code that "does the work" out of the conditional if statement. This is helpful, because now you can see at-a-glance what will cause the exception; if the lengths are not equal, then _boom_ we have a problem. And now also, you can see the "working" code on its own, _not nested within conditional statements_. Imagine you have two or three if statements!

```
# nested statements
def my_function():
    if feature_is_enabled:
        if user_settings.notifications == "on":
            if thing_1 == thing_2:
                return do_the_work()
            else:
                raise Exception("things aren't equal!")
         else:
             show_tooltip(message="Please enable in settings menu")
             return
    else:
        show_tooltip(message="Feature not enabled!")
        return


# return-early code pattern
def my_function():
    if not feature_is_enabled:
        show_tooltip(message="Feature not enabled!")

    if user_settings.notifications == "off":
        show_tooltip(message="Please enable in settings menu")

    if thing_1 != thing_2:
        raise Exception("things aren't equal!")

    return do_the_work()
```

This pattern is often referred to as "returning early," and the statements themselves can be called "guard clauses". If there can be a problem, go ahead and check for it at the beginning. This way, if the code makes it all the way through the error-checking part at the top, then you can stop worrying about whether the function's arguments are correct, and you can focus just on what the function is supposed to be doing. And no more pesky nesting making it hard to read!