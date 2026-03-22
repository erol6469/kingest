import sys
p = sys.argv[1]
t = open(p).read()

# Fix the mangled bundle identifiers
t = t.replace('"com.kingest.v8$(PRODUCT_NAME:rfc1034identifier)"', '"com.kingest.v8"')

# Now add DEVELOPMENT_TEAM after each PRODUCT_BUNDLE_IDENTIFIER = "com.kingest.v8";
old = 'PRODUCT_BUNDLE_IDENTIFIER = "com.kingest.v8";'
new = '''PRODUCT_BUNDLE_IDENTIFIER = "com.kingest.v8";
				DEVELOPMENT_TEAM = 7G3LGNJ4PJ;
				CODE_SIGN_STYLE = Automatic;'''
t = t.replace(old, new)

open(p, 'w').write(t)
print(f"DEVELOPMENT_TEAM entries: {t.count('DEVELOPMENT_TEAM')}")
print(f"Bundle IDs (com.kingest.v8): {t.count('com.kingest.v8')}")
