Regenerar a foto do autor na landing (fundo removido + fundo branco):

1. Coloque o JPG em public/images/felipe-aguiar-source.jpg
2. Python (rembg):
   python -c "from rembg import remove; open('public/images/felipe-aguiar-nobg.png','wb').write(remove(open('public/images/felipe-aguiar-source.jpg','rb').read()))"
3. Compor fundo branco e WebP:
   npx sharp-cli -i public/images/felipe-aguiar-nobg.png -o public/images/felipe-aguiar.webp flatten --background "#ffffff"

Atualize width/height em HomeLandingAuthorHero.tsx (AUTHOR_PHOTO) se a resolução mudar.
