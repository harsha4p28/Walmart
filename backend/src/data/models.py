from mongoengine import Document, StringField, EmailField,IntField

class User(Document):
    fullname=StringField(required=True, max_length=100)
    email=EmailField(required=True,unique=True)
    username=StringField(required=True, max_length=100, unique=True)
    password=StringField(required=True)
    phno=IntField(required=True,unique=True)
