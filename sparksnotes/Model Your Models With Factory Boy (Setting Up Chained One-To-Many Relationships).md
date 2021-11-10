#blog #guide #idea #draft

Factory-Boy is a super useful Python library used to replace "...static, hard to maintain fixtures \[in your test suites\] with easy-to-use factories for complex objects."

> Instead of building an exhaustive test setup with every possible combination of corner cases, `factory_boy` allows you to use objects customized for the current test, while only declaring the test-specific fields

(Quoted from the [factory-boy documentation](https://factoryboy.readthedocs.io/en/stable/))

Essentially, rather than having to build your test objects from scratch, or maintain a database full of test data -- Factory-Boy can do the heavy lifting for you! Once configured, the tool will create test objects with randomly generated test data (any detail of which you can override with custom values when you call for the object to be generated).

For newer users like me, the setup can be a bit daunting though! Correctly configuring the relationships caused some grief. I'd like to walk you through the pattern I've settled on (for the moment), so that you may have a nicer starting point on your project.

These are the relevant libraries I'm using:
- factory-boy
- SQLAlchemy
- pytest

*Note/Disclaimer: These don't necessarily represent best-practices; it's just what has worked for me so far.*

---

## Table of Contents
- The Project
- The Models
- Approach to building factories
- Creating fake data
	- Faker
	- LazyAttributes
	- SelfAttributes
- Building relationships
	- SubFactories
	- PostGeneration (for the "many" part)
- A tip for improving tests: Subclassed Factories
- Final Code Samples
- Common Errors
	- TypeError: "my_attribute" is an invalid keyword argument for "MyModel"
	- TypeError: "Faker" object is not callable
- Additional Resources
	- [Another article on One-to-Many relationships in Factory-Boy](https://simpleit.rocks/python/django/setting-up-a-factory-for-one-to-many-relationships-in-factoryboy/)
	- [Factory-Boy Documentation](https://factoryboy.readthedocs.io/en/stable/)
	- [SQLAlchemy ORM Exceptions Reference](https://docs.sqlalchemy.org/en/14/orm/exceptions.html)

---

## The project
Imagine you're a contractor and you need to keep track of your invoices. You may decide to have a handful of (simplified) models to organize the information you'll be working with:

User (you as a contractor!)
- Name
- Email
- Phone
- \[List of Clients]

Client
- Name
- Company
- Email
- \[List of Contracts]
- User(owner)

Contract
- Start Date
- End Date
- Summary/Description
- \[List of Invoices]
- Client(owner)

Invoice
- Start Date ("Period Start" in my examples)
- End Date ("Period End")
- Amount
- Contract(owner)

The User may have many Clients, each of which may be associated with multiple Contracts, broken into several Invoice periods.

## The models
I'll be using SQLAlchemy to build my models; Factory-Boy has [support](https://factoryboy.readthedocs.io/en/stable/orms.html) for several popular ORMs!

My models look like this:
```python
class Users(db.Model):
 	__tablename__ = "Users"

 	id = db.Column(db.Integer, primary_key=True, nullable=False)
 	name = db.Column(db.String, nullable=False)
 	email = db.Column(db.String, nullable=False)
	phone = db.Column(db.String, nullable=False)

 	clients = db.relationship("Clients", back_populates="user", cascade="all, delete-orphan")


class Clients(db.Model):
	 __tablename__ = "Clients"

	 id = db.Column(db.Integer, primary_key=True, nullable=False)
	 name = db.Column(db.String, nullable=False)
	 company_name = db.Column(db.String, nullable=False)
	 email = db.Column(db.String, nullable=False)

	 user_id = db.Column(db.Integer, db.ForeignKey("Users.id"), nullable=False)
	 user = db.relationship("Users", back_populates="clients")

	 contracts = db.relationship("Contracts", back_populates="client", cascade="all, delete-orphan")


class Contracts(db.Model):
	 __tablename__ = "Contracts"

	 id = db.Column(db.Integer, primary_key=True, nullable=False)
	 summary = db.Column(db.String)
	 start_date = db.Column(db.Date, nullable=False)
	 end_date = db.Column(db.Date)

	 client_id = db.Column(db.Integer, db.ForeignKey("Clients.id"), nullable=False)
	 client = db.relationship("Clients", back_populates="contracts")

	 invoices = db.relationship("Invoices", back_populates="contract", cascade="all, delete-orphan")
	 
	 
class Invoices(db.Model):
	 __tablename__ = "Invoices"

	 id = db.Column(db.Integer, primary_key=True, nullable=False)
	 period_start = db.Column(db.Date, nullable=False)
	 period_end = db.Column(db.Date)

	 contract_id = db.Column(db.Integer, db.ForeignKey("Contracts.id"), nullable=False)
	 contract = db.relationship("Contracts", back_populates="invoices")
```

## Approach to building factories
Especially if this is your first time working with Factory-Boy, I *highly* recommend a Test-Driven Development (TDD) workflow ([info here](https://www.guru99.com/test-driven-development.html) is a quick resource I found on TDD if you're not familiar). It is highly-instructive and will be invaluable in making sure you know where your (sometimes unclear) errors are coming from.

Below, I'll be incrementing progress on the tests and factories in tandem; first I'll show you my directory tree for a bit of context.
```
project_root
|
+---models
|	|	__init__.py
|	|	users.py
|	|	clients.py
|	|	contracts.py
|	|	invoices.py
|
+---tests
	|
	+---factories
	|	|	__init__.py
	|	|	users.py
	|	|	clients.py
	|	|	contracts.py
	|	|	invoices.py
	|
	\---test_models
		|	test_users.py
		|	test_clients.py
		|	test_contracts.py
		|	test_invoices.py
		
```

Each model will need at least one corresponding factory -- the `factory` module will provide us ways (via the `faker` [library](https://faker.readthedocs.io/en/master/)) to describe what each attribute/field should look like when test data is generated.

Let's begin building a factory representation of our `Users` model -- I'll start with a couple of tests to describe what I'd like to see:

> ***Reader, please note**: The following code is not in its final verison; by the end, we will have made a couple of improvements. To see it all in its finished state, please visit the [#Final-Code-Samples] section at the end.

```python
# test_users.py

from factories.users import UsersFactory


def test_create_user():
	""" ensure that the object can be created without issue """
	user = UsersFactory.create()
	assert user
	
	
	class TestAttributes:
	""" ensure that my object has all of the correct attributes """
	
		def test_user_has_id(self):
			user = UsersFactory.create()
			assert user.id
			
		def test_user_has_name(self):
			user = UsersFactory.create()
			assert user.name
			
		# ... and so on

```

I expect to be able to successfully create a User object, and for its necessary attributes to exist. Here's a factory that should satisfy these tests:

```python
# factories/users.py

import factory
from project_root.models import db, Users

class UsersFactory(factory.alchemy.SQLAlchemyModelFactory):
	class Meta
		model = Users
		sqlalchemy_session = db.session
		# the above represents a database session which is used to save to the db
		
	id = factory.Sequence(lambda n: n + 1)
	name = factory.Faker("name")
	
```

Upon calling UsersFactory.create(), factory-boy will create a new entry in the database and will use these attributes to populate the data columns.

## Creating fake data
**`factory.Sequence`** automatically increments a number `n` and gives it to its `lambda` function; with the simple `lambda` used above, we will get ids incrementing up from 1.

---

**`factory.Faker`** is your bread-and-butter in terms of creating fake data. `Factory-Boy` implements its own wrapper of the `faker` library: Where you may normally call a faker *provider* (e.g. `fake.name()` to get a result like `Jane Doe`), we now use `factory.Faker()` and pass it the *name* of the provider instead as the first argument (`factory.Faker("name")`).

Some providers accept arguments (e.g. `fake.sentence(nb_words=6)`); in our case, we will supply those values as arguments following the provider name: `factory.Faker("sentence", nb_words=6)`.

---

**`factory.LazyAttribute`** can be useful for creating data that depends on other information from the same object. To use it, pass `factory.LazyAttribute()` a `lambda` function which handles the object instance as argument. A common example is an email field that is built from an employee's first and last name:
```python
# EmployeeFactory
email = factory.LazyAttribute(lambda obj: f"{obj.fname}.{obj.lname}@xyzcorp.com")
```
*See also: [factory.LazyFunction](https://factoryboy.readthedocs.io/en/stable/introduction.html#lazyfunction) for when you need a function but not the object*

---

**`factory.SelfAttribute`** is used by an object to access data from another one of its attributes, by passing it a string. In our case, consider a `client` which stores a reference to its parent `user` object. If we want to define `client.user_id`, we might use `user_id = factory.SelfAttribute("user.id")`.

Interestingly, we can also access the parent object's attributes! Using Python relative import syntax / dot notation, we could access `client.user.name` like
```python
# in ClientsFactory class
name_of_parent_user = factory.SelfAttribute("..name")`.
```
*See the docs for this function [here](https://factoryboy.readthedocs.io/en/stable/reference.html?highlight=selfattribut#factory.SelfAttribute)*

This will come into play once we've created relationships between our factories.

---

There are many ways to get your data into the right places, but this will be enough for our purposes.

## Building relationships

### SubFactories
Once we're able to build objects for single models, we then need to show our factories how multiple objects should be connected. One tool for doing so will be the [`factory.SubFactory`](https://factoryboy.readthedocs.io/en/stable/reference.html#subfactory). As a factory is creating a new object, when it reaches an attribute which calls `SubFactory` with another model's factory, it will go and create *that* object before continuing on with the current one.

For example, a `Person` model might be related to a `Pet` model. While creating a `Person`, we might see something like `pet = factory.SubFactory(Pet)`. A new `Pet` will be created, and attached to our `Person`.

In the case of our models here, the relationship between our `Users` and `Clients` may looks like this:
```python
# factories/users.py
class UsersFactory(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Users
		sqlalchemy_session = db.session

	id = factory.Sequence(lambda n: n + 1)
	name = factory.Faker("name")
	email = factory.LazyAttribute(lambda c: f"{name.replace(" ", "")}@gmail.com".lower()) # bad way to do this, but just for example
	
	# We will use a different strategy, described later, to attach Clients here.
	
# factories/clients.py
class ClientsFactory(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Clients
		sqlalchemy_session = db.session

	id = factory.Sequence(lambda n: n + 1)
	name = factory.Faker("name")
	company_name = factory.Faker("company")
	email = factory.LazyAttribute(lambda c: f"{name.replace(" ", "")}@email.com".lower())

	user = factory.SubFactory("factories.users.UsersFactory")
	user_id = factory.SelfAttribute("user.id")
```
> ***Wait, why are we giving `factory.SubFactory` a string?***
> 
> *[Circular imports](https://factoryboy.readthedocs.io/en/stable/reference.html#subfactory-circular)! Imagine we want to create a `User`. In the process of creating a `User`, Factory-Boy will create a related `Client`. But wait... when we go to create that `Client`, the factory will attempt to go back and create a related `User`!*
> 
> *To handle this loop, we pass an absolute path (string) to `factory.SubFactory` instead of just passing the factory itself. The library will handle it accordingly!*

So, now we can create singularly related objects. But I promised One-To-Many relationships!

### PostGeneration (for the "many" part)
As the name implies, "PostGeneration" code runs after the object in question is finished generating. It can be used for all sorts of purposes, but in this case, we will use it to create some related objects.

Syntatically, there are a few ways to implement this behavior; my preferred style is with the [`@factory.post_generation`](https://factoryboy.readthedocs.io/en/stable/reference.html#factory.post_generation) function decorator.

Therea are a couple of arguments to know about when using this hook: `create`, and `extracted`.
- `create` refers to the build strategy of the object, generally "create" or "build". By default, "create" is used; this makes an object and stores it, whereas build makes an object but does *not* store it (documentation [here](https://factoryboy.readthedocs.io/en/stable/reference.html#factory.CREATE_STRATEGY)).
- `extracted` and `**kwargs` are a little beyond the scope of this particular piece but in short, you can pass data from the factory creation function all the way down into the post_generation hook. I encourage you to take a quick look at the documentation [here](https://factoryboy.readthedocs.io/en/stable/reference.html#extracting-parameters) for details.

Our post-generation methods might follow this pattern, which I first found in [this article](https://simpleit.rocks/python/django/setting-up-a-factory-for-one-to-many-relationships-in-factoryboy/):
```python
class UsersFactory(factory.alchemy.SQLAlchemyModelFactory):
	# regular attributes here
	
	@factory.post_generation
	def populate_clients(self, create, extracted, **kwargs):
		if not create:
			return
			
		if extracted:
			# handle the passed arguments
		
		else:
			# optionally place this in a loop to make many associated clients!
			ClientsFactory.create(user=self)

```

Our models are expecting to have the User's clients on `user.clients`; factory-boy will ensure that the objects created with `ClientsFactory.create(user=self)` will show up in the right place, and have the correct association with the user object (`self`) we've handed to it.

### A tip for improving tests: Subclassed Factories
Earlier, I wrote a couple of tests which involved `UsersFactory.create()`. This becomes problematic once we add child factories; factory-boy automatically generates these objects all the way down the line when we create the parent. If a user test attempts to create a `user`, and finds an error in `ClientsFactory`, that user test will fail. But if we are testing `Users`, we don't want to be finding errors in `Clients`! Ideally, we will only be catching those issues in `test_Clients.py`.

Imagine we've got Users -> Clients -> Contracts working. I then make a small breaking change to Contracts, and run my test suite. *Now every single test in the entire suite fails!* This is highly undesirable, as it does not help us quickly isolate or identify the newly introduced problem.

Instead, we'd like a way to isolate our factories such that they do not depend on subsequent factories (unless we're testing something that specifically requires this). Thankfully, one solution is relatively straightforward.

By creating a "Base" factory for each of our models, and then subclassing it in order to fit our needs for a particular use, we can use only what we need. For example, our base `Users` factory may have all of the simple data like name, email, etc., but with no relationships involved. Then we may have another factory which extends that base and adds the `clients` attribute, but only as an empty list!
```python
# factories/users.py
from sqlalchemy.orm.collections import InstrumentedList

class UsersFactoryBase(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Users
		sqlalchemy_session = db.session

	id = factory.Sequence(lambda n: n + 1)
	name = factory.Faker("name")
	email = factory.LazyAttribute(lambda c: f"{c.first_name}.{c.last_name}@gmail.com".lower())
	phone = factory.Faker("phone")
	
	
class IsolatedUsersFactory(UsersFactoryBase):
	# this is the type that SQLAlchemy uses for its lists
	clients = InstrumentedList()
	
	
class UsersFactory(UsersFactoryBase):
	@factory.post_generation
	def populate_clients(self, create, extracted, **kwargs):
		if not create:
			return

		if extracted:
			# handle passed data 

		else:
			for _ in range(2):
				ClientsFactory.create(user=self)
```

Now in our tests, we can call `IsolatedUsersFactory.create()` and we will be given a `user` which has no clients and is *not dependent* on any child objects. When we want to test some aspect of the relationship between `user` and its child objects, we can use `UsersFactory` which will give us *everything*. If an exception occurs in the generation of any object, we will see this test fail. BUT, it's better than before!

And to isolate our tests even further from unrelated code that we aren't trying to test, we can create a related object *in advance*, and then hand it to our test object upon creation so that we are only generating what we need. See below, where we will test `Users` and `Clients` without involving `Contracts`:
```python
# test_models/test_users.py
from factories.users import IsolatedUsersFactory
from factories.clients import IsolatedClientsFactory

test_clients_list_not_empty():
	user = IsolatedUsersFactory.create()
	IsolatedClientsFactory.create_batch(3, user=user)
	
	assert len(user.clients) == 3


test_client_userid_equals_user_id():
	user = IsolatedUsersFactory.create()
	IsolatedClientsFactory.create_batch(3, user=user)
	
	for c in user.clients:
		assert user.id == c.user_id
```

In our first test, we confirm that the clients are successfully being attached to the `user.clients` property.

In our second test, we confirm that our code is correctly finding the user's `id` attribute, and inserting this data onto the client's `user_id` attribute.

Both of these tests required the creation of related objects, but by approaching the issue in this way with the `Isolated***Factory`, we are only generating the objects that we *need* and we are minimizing the possibilty that our tests will fail due to unrelated code.

> *You can get as fancy as you like with the subclassed factories pattern! If you find yourself frequently needing the same setup as the above tests, perhaps it would make sense to create a class called `UserWithThreeClients` factory.*

## Final Code Examples
Models:
```python
# models/users.py
from where_I_initialized import db

class Users(db.Model):
	id = db.Column(db.Integer, primary_key=True, nullable=False)
	name = db.Column(db.String, nullable=False)
	email = db.Column(db.String, nullable=False)
	phone = db.Column(db.String)
	
	clients = db.relationship("Clients", back_populates="user", cascade="all, delete-orphan")
	
	
# models/clients.py
class Clients(db.Model):
	# name, company_name, email
	
	user_id = db.Column(db.Integer, db.ForeignKey("Users.id"), nullable=False)
	user = db.relationship("Users", back_populates="clients")
	
	contracts = db.relationship("Contracts", back_populates="client", cascade="all, delete-orphan")
	

# models/contracts.py
class Contracts(db.Model):
	summary = db.Column(db.String)
	start_date = db.Column(db.Date, nullable=False)
	end_date = db.Column(db.Date)
	
	client_id = db.Column(db.Integer, db.ForeignKey("Clients.id"), nullable=False)
	client = db.relationship("Clients", back_populates="contracts")
	
	invoices = db.relationship("Invoices", back_populates="contract", cascade="all, delete-orphan")


# models/invoices.py
class Invoices(db.Model):
	id = db.Column(db.Integer, primary_key=True, nullable=False)
	period_start = db.Column(db.Date, nullable=False)
	period_end = db.Column(db.Date)

	contract_id = db.Column(db.Integer, db.ForeignKey("Contracts.id"), nullable=False)
	contract = db.relationship("Contracts", back_populates="invoices")

```

Factories:
```python
# factories/users.py
import factory
import random
from sqlalchemy.orm.collections import InstrumentedList

from .clients import ClientsFactory
from models import db, Users

class UsersFactoryBase(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Users
		sqlalchemy_session = db.session

	id = factory.Sequence(lambda n: n + 1)
	name = factory.Faker("name")
	email = factory.LazyAttribute(lambda c: f"{name.replace(" ", "")}@gmail.com".lower()) # bad way to do this, but just for example
	phone = factory.Faker("phone")
	
	
class IsolatedUsersFactory(UsersFactoryBase):
	# this is the type that SQLAlchemy uses for its lists
	clients = InstrumentedList()
	
	
class UsersFactory(UsersFactoryBase):
	@factory.post_generation
	def populate_clients(self, create, extracted, **kwargs):
		if not create:
			return
		if extracted:
			# handle passed data 
		else:
			for _ in range(random.randint(1, 3)):
				ClientsFactory.create(user=self)


# factories/clients.py
import factory
import random
from sqlalchemy.orm.collections import InstrumentedList

from .contracts import ContractsFactory
from models import db, Clients

class ClientsFactoryBase(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Clients
		sqlalchemy_session = db.session

	id = factory.Sequence(lambda n: n + 1)
	name = factory.Faker("name")
	company_name = factory.Faker("company")
	email = factory.LazyAttribute(lambda c: f"{name.replace(" ", "")}@gmail.com".lower())
	
	user = factory.SubFactory("factories.users.IsolatedUsersFactory")
	user_id = factory.SelfAttribute("user.id")
	
	
class IsolatedClientsFactory(ClientsFactoryBase):
	contracts = InstrumentedList()
	
	
class ClientsFactory(ClientsFactoryBase):
	@factory.post_generation
	def populate_contracts(self, create, extracted, **kwargs):
		if not create:
			return
		if extracted:
			# handle passed data 
		else:
			for _ in range(random.randint(1, 3)):
				ContractsFactory.create(user=self)


# factories/contracts.py
import factory
import random
import datetime
from sqlalchemy.orm.collections import InstrumentedList

from .invoices import InvoicesFactory
from models import db, Contracts

class ContractsFactoryBase(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Contracts
		sqlalchemy_session = db.session

	id = factory.Sequence(lambda n: n + 1)
	summary = factory.Faker("paragraph", nb_sentences=3)
	start_date = factory.Faker("date_between", start_date="-24M", end_date="-12M")
	end_date = factory.Faker("date_between", start_date="-11M")
	
	client = factory.SubFactory("factories.clients.IsolatedClientsFactory")
	client_id = factory.SelfAttribute("client.id")
	
	
class IsolatedContractsFactory(ContractsFactoryBase):
	invoices = InstrumentedList()
	
	
class ContractsFactory(ContractsFactoryBase):
	@factory.post_generation
	def populate_invoices(self, create, extracted, **kwargs):
		if not create:
			return
		if extracted:
			# handle passed data 
		else:
			for _ in range(random.randint(1, 5)):
				InvoicesFactory.create(user=self)
				
				
# factories/invoices.py
import factory
import random
import datetime
from sqlalchemy.orm.collections import InstrumentedList

from models import db, Invoices

class InvoicesFactoryBase(factory.alchemy.SQLAlchemyModelFactory):
	class Meta:
		model = Invoices
		sqlalchemy_session = db.session

	id = factory.Faker(lambda n: n + 1)
	period_start = factory.Faker(
		"date_between",
		start_date=factory.SelfAttribute("..contract.start_date"),
		end_date=factory.SelfAttribute("..contract.end_date")
	)
	period_end = factory.LazyAttribute(
		lambda self: self.period_start + datetime.timedelta(days=7)
	)
	
	contract = factory.SubFactory("factories.contracts.IsolatedContractsFactory")
	contract_id = factory.SelfAttribute("contract.id")

```

## A Few Common Errors
Here are a couple of frequent exceptions / errors that I encountered while learning to work with the library. I know there are more than I can remember right now -- I'll update the list if I encounter them in the future.

---

### TypeError: "Faker" object is not callable
- **Library**: Factory-Boy
- **Cause**: This may indicate misuse of a `factory.LazyAttribute()` somewhere. *This function expects to be passed a function as an argument, often a `lambda` function*. Example:
```python
is_child = factory.Faker("boolean")
allowed_to_drive = factory.LazyAttribute(lambda obj: False if obj.is_child else True)
```
If the thing passed to `LazyAttribute` is not callable (a funtion), it will result in this error.
- **Sample Traceback**:
```python
venv\lib\site-packages\factory\base.py:528: in create
    return cls._generate(enums.CREATE_STRATEGY, kwargs)
venv\lib\site-packages\factory\alchemy.py:51: in _generate
    return super()._generate(strategy, params)
venv\lib\site-packages\factory\base.py:465: in _generate
    return step.build()
venv\lib\site-packages\factory\builder.py:258: in build
    step.resolve(pre)
venv\lib\site-packages\factory\builder.py:199: in resolve
    self.attributes[field_name] = getattr(self.stub, field_name)
venv\lib\site-packages\factory\builder.py:344: in __getattr__
    value = value.evaluate_pre(
venv\lib\site-packages\factory\declarations.py:48: in evaluate_pre
    return self.evaluate(instance, step, context)
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ 

self = <factory.declarations.LazyAttribute object at 0x000002627C5C7820>
instance = <Resolver for <BuildStep for <StepBuilder(<SQLAlchemyOptions for IsolatedUsersFactory>, strategy='create')>>>
step = <BuildStep for <StepBuilder(<SQLAlchemyOptions for IsolatedUsersFactory>, strategy='create')>>, extra = {}

    def evaluate(self, instance, step, extra):
        logger.debug("LazyAttribute: Evaluating %r on %r", self.function, instance)
>       return self.function(instance)
E       TypeError: 'Faker' object is not callable

venv\lib\site-packages\factory\declarations.py:100: TypeError
```

---

### TypeError: "my_attribute" is an invalid keyword argument for "MyModel"
- **Library**: SQLAlchemy
- **Cause**: You may have an attribute defined in your Factory, which is not defined in your model. E.g. `MyModel` does not have a field/column for `my_attribute`.
- **Sample Traceback**:
```python
venv\lib\site-packages\factory\base.py:528: in create
    return cls._generate(enums.CREATE_STRATEGY, kwargs)
venv\lib\site-packages\factory\alchemy.py:51: in _generate
    return super()._generate(strategy, params)
venv\lib\site-packages\factory\base.py:465: in _generate
    return step.build()
venv\lib\site-packages\factory\builder.py:262: in build
    instance = self.factory_meta.instantiate(
venv\lib\site-packages\factory\base.py:317: in instantiate
    return self.factory._create(model, *args, **kwargs)
venv\lib\site-packages\factory\alchemy.py:99: in _create
    return cls._save(model_class, session, *args, **kwargs)
venv\lib\site-packages\factory\alchemy.py:105: in _save
    obj = model_class(*args, **kwargs)
<string>:4: in __init__
    ???
venv\lib\site-packages\sqlalchemy\orm\state.py:480: in _initialize_instance
    manager.dispatch.init_failure(self, args, kwargs)
venv\lib\site-packages\sqlalchemy\util\langhelpers.py:70: in __exit__
    compat.raise_(
venv\lib\site-packages\sqlalchemy\util\compat.py:207: in raise_
    raise exception
venv\lib\site-packages\sqlalchemy\orm\state.py:477: in _initialize_instance
    return manager.original_init(*mixed[1:], **kwargs)
_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

self = <Users (transient 2153595579984)>
kwargs = {'blah': 'hello', 'clients': [], 'email': 'kristi.ibarra@gmail.com', 'first_name': 'Kristi', ...}
cls_ = <class 'api.models.users.Users'>, k = 'blah'

    def _declarative_constructor(self, **kwargs):
        """A simple constructor that allows initialization from kwargs.

        Sets attributes on the constructed instance using the names and
        values in ``kwargs``.

        Only keys that are present as
        attributes of the instance's class are allowed. These could be,
        for example, any mapped columns or relationships.
        """
        cls_ = type(self)
        for k in kwargs:
            if not hasattr(cls_, k):
>               raise TypeError(
                    "%r is an invalid keyword argument for %s" % (k, cls_.__name__)
                )
E               TypeError: 'blah' is an invalid keyword argument for Users

venv\lib\site-packages\sqlalchemy\orm\decl_base.py:1142: TypeError
```

---

## Additional Resources
A few things that may be useful:
- [Another article on One-to-Many relationships in Factory-Boy](https://simpleit.rocks/python/django/setting-up-a-factory-for-one-to-many-relationships-in-factoryboy/)
- [Factory-Boy Documentation](https://factoryboy.readthedocs.io/en/stable/)
- [SQLAlchemy ORM Exceptions Reference](https://docs.sqlalchemy.org/en/14/orm/exceptions.html)