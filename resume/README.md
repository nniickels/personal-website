# Resume source

`resume.tex` is the source for `public/resume.pdf` (the website version without course grades).

Build with Tectonic from the repository root:

```sh
tectonic resume/resume.tex --outdir public
```

Check that the PDF remains one page and inspect its rendered layout before committing it.

The personal version with course grades is maintained separately as
`NicoleJiang_Resume_JakeStyle.tex` beside its PDF in the OneDrive personal resumes folder.
