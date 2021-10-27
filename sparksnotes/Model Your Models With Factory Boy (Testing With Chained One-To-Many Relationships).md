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
- 
- PostGeneration (method replaced by its output)
- Common Errors
	- Mapped Class "Model -> Model"
	- Object "Faker" is not callable (Lazyattr expects lambda)

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
Especially if this is your first time working with Factory-Boy, I *highly* recommend a Test-Driven Development (TDD) workflow ([here](https://www.guru99.com/test-driven-development.html) is a quick resource I found on TDD if you're not familiar). It is highly-instructive and will be invaluable in making sure you know where your (sometimes unclear) errors are coming from.

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

> ***Reader, please note**: The following code is not in its final verison; by the end, we will have made a couple of improvements. To see it all in its finished state, please visit the [#Code-Samples] section at the end.

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

**`factory.Faker`** is your bread-and-butter in terms of creating fake data. `Factory-Boy` implements its own wrapper of the `faker` library: Where you may normally call a faker *provider* (e.g. `fake.name()` to get a result like `Jane Doe`), we now use `factory.Faker()` and pass it the *name* of the provider instead as the first argument (`factory.Faker("name")`).

Some providers accept arguments (e.g. `fake.sentence(nb_words=6)`); in our case, we will supply those values as arguments following the provider name: `factory.Faker("sentence", nb_words=6)`.

**`factory.LazyAttribute`** can be useful for creating data that depends on other information from the same object. To use it, pass `factory.LazyAttribute()` a `lambda` function which handles the object instance as argument. A common example is an email field that is built from an employee's first and last name:
```python
# EmployeeFactory

email = factory.LazyAttribute(lambda obj: f"{obj.fname}.{obj.lname}@xyzcorp.com")
```
*See also: [factory.LazyFunction](https://factoryboy.readthedocs.io/en/stable/introduction.html#lazyfunction) for when you need a function but not the object*

## Building relationships