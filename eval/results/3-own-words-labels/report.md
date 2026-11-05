# 只批 · 真实模型测试报告

- 模型：`claude-opus-5-5`，通过 `claude -p` 发送与应用完全相同的提示词（`src/lib/prompts.ts`），并经过与应用相同的护栏和锚定（`src/lib/guard.ts`、`src/lib/engine.ts`）
- 3 份草稿（英文论文、德文报告、中文短文），每份植入 5 个已知问题；英文稿再做一轮“改掉 2 个、留下 3 个”的复查测试
- 时间：2026-11-05T00:00:49.124Z · 花费约 $0.48

**总计：19/20 项通过**

| 检查项 | 结果 | 详情 |
|---|---|---|
| [en-thesis] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [en-thesis] 批注全部锚定到原文 | ✅ | 11/11 锚定成功 |
| [en-thesis] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [en-thesis] 护栏不误删（移除数 ≤ 模型真实改写数 + 1） | ✅ | 护栏移除 1 处，裁判认定的真实改写 0 处 |
| [en-thesis] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 1 处 |
| [en-thesis] 复查：已修改的问题判为已解决 | ✅ | “significantly” without a statistical test / numbers → resolved/partly |
| [en-thesis] 复查：已修改的问题判为已解决 | ✅ | overgeneralisation: one parameter varied, one material, claims "dominant" for all AM → resolved/resolved |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ❌ | undefined abbreviation / inconsistent with Ra → partly/open |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ✅ | no citation → open |
| [en-thesis] 复查：未修改的问题仍判为未解决 | ✅ | recommendation ignores trade-offs (density, top surface only) and goes beyond the data → open/open |
| [de-bericht] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [de-bericht] 批注全部锚定到原文 | ✅ | 12/12 锚定成功 |
| [de-bericht] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [de-bericht] 护栏不误删（移除数 ≤ 模型真实改写数 + 1） | ✅ | 护栏移除 0 处，裁判认定的真实改写 0 处 |
| [de-bericht] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 0 处 |
| [zh-essay] 植入问题被指出（≥ 4/5） | ✅ | 5/5；漏掉：无 |
| [zh-essay] 批注全部锚定到原文 | ✅ | 10/10 锚定成功 |
| [zh-essay] 显示给用户的内容里没有改写（裁判） | ✅ | 无 |
| [zh-essay] 护栏不误删（移除数 ≤ 模型真实改写数 + 1） | ✅ | 护栏移除 0 处，裁判认定的真实改写 0 处 |
| [zh-essay] 模型本身遵守“不改写”（护栏前，仅供参考） | ✅ | 模型原始输出中裁判发现 0 处；护栏移除 0 处 |

## en-thesis

```
4.1 Effect of scan speed on surface roughness

Surface roughness Ra was measured on twelve cubes printed with scan speeds between 600 and 1400 mm/s. Increasing the scan speed significantly improves the surface quality. This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts. The SR values were taken on the top surfaces only. Previous studies have found the same trend. Based on these results, we recommend using the highest scan speed in production.
```

1. 「Increasing the scan speed significantly improves the surface quality.」（evidence/major）这句话没有给出任何数值。Ra 从多少变到了多少？“significantly”是指做过统计检验（检验方法是什么、p 值是多少），还是只是数值看起来差得多？ — _审稿人看到“significantly”会默认指统计显著性，没有数据和检验支撑，这个结论就站不住。_
2. 「Increasing the scan speed significantly improves the surface quality.」（precision/major）“improves”在这里具体指 Ra 变大还是变小？这种变化是单调的，还是在 600–1400 mm/s 之间某处出现了拐点？读者能否看到对应的图或表？ — _没有交代变化方向和曲线形状，读者无法判断这个趋势是否成立，也无法和文献比较。_
3. 「Surface roughness Ra was measured on twelve cubes printed with scan speeds between 600 and 1400 mm/s.」（evidence/major）十二个试样是怎样分配到各个速度水平的：一共几个水平，每个水平几个重复？测量用的是什么仪器，取样长度、测量方向和每个面的测量次数分别是多少？ — _不知道重复数和测量条件，读者就没法评估数据的离散程度和结论的可靠性。_
4. 「This clearly shows that scan speed is the dominant factor for the surface finish of all metal AM parts.」（argument/major）这次实验只改变了扫描速度，激光功率、层厚、扫描间距等其他参数都没有变化。在这种设计下，能否说明扫描速度比其他因素更“dominant”？ — _单因素实验不能用来比较各因素的相对重要性，所以这是逻辑上的跳跃。_
5. 「for the surface finish of all metal AM parts」（argument/major）这次实验用的是哪种材料和哪种工艺（是 L-PBF 吗）？试样几何形状又是什么？只用一种材料的立方体，凭什么推广到“all metal AM parts”，包括其他合金、其他工艺和复杂结构？ — _结论超出了数据能覆盖的范围，答辩委员很容易抓住这一点质疑。_
6. 「clearly shows」（language/minor）实验证据本身是否已经“clearly”到可以用这样的强语气？如果把这类强化词删掉，结论还能不能立住？ — _在学术写作中，语气强弱应当和证据强度相称。_
7. 「The SR values were taken on the top surfaces only.」（structure/major）这条测量范围的限制为什么放在结论之后？它和上一句说的“all metal AM parts”是否互相矛盾？侧面和下表面的粗糙度机理（例如粘粉、阶梯效应）不同，这一点对结论意味着什么？ — _关键的限制条件出现在结论之后，读者会觉得前面的推论没有考虑到它。_
8. 「The SR values」（terminology/minor）前文用的是“Surface roughness Ra”，这里突然出现“SR”。这个缩写在哪里定义过？它和 Ra 是同一个量吗？全文能否统一用一个术语？ — _术语前后不一致，又没有定义，会让读者怀疑指的是另一个参数。_
9. 「Previous studies have found the same trend.」（evidence/major）具体是哪些研究？引用在哪里？这些研究用的材料、速度范围和测量面是否和你的实验可比？有没有文献报告了相反的结果，比如高速下出现球化、熔池不稳定导致粗糙度变差？ — _没有引用，又不讨论文献之间的差异，这句话起不到支撑作用，答辩时也会被追问。_
10. 「Based on these results, we recommend using the highest scan speed in production.」（argument/major）生产推荐只看表面粗糙度就够了吗？高扫描速度对致密度、孔隙（如未熔合缺陷）、力学性能有什么影响，你考虑过吗？“highest”是指 1400 mm/s，还是可以外推到你没有测试过的速度？ — _根据单一指标、单一范围做工程推荐，忽略了权衡，结论的风险很大。_
11. 「Based on these results, we recommend」（structure/minor）这一段依次是：方法、结论、泛化、限制、文献、推荐。能否先把方法和条件（包括只测了上表面）交代完，再给数据和结果，然后和文献对比，最后讨论适用范围？ — _段落顺序混乱，读者难以把证据和结论对应起来。_

## de-bericht

```
2 Versuchsaufbau

Für die Messungen wurde die Kamera mit den üblichen Einstellungen betrieben. Die Belichtungszeit war sehr kurz, sodass Bewegungsunschärfe ausgeschlossen werden kann. Das Schlierenbild zeigt deutlich die Gasströmung über dem Schmelzbad. Da die Strömung laminar ist, kann der Einfluss auf die Partikel vernachlässigt werden. Die Ergebnisse werden in Kapitel 5 diskutiert, wobei sich zeigt, dass das System sehr gut funktioniert.
```

1. 「mit den üblichen Einstellungen betrieben」（precision/major）Welche Einstellungen sind konkret gemeint, mit Zahlenwerten und Einheiten (Bildrate, Belichtung, Blende, Auflösung)? Und für wen sind sie „üblich“? — _Wer den Versuch nachstellen oder prüfen will, kann mit „üblich“ nichts anfangen._
2. 「die Kamera」（evidence/major）Um welche Kamera und welches Objektiv handelt es sich, und wo stehen sie relativ zum Schmelzbad? — _Ohne Angaben zu Kameratyp, Objektiv, Bildrate und Auflösung lässt sich der Aufbau nicht nachvollziehen._
3. 「Die Belichtungszeit war sehr kurz」（precision/major）Wie lang war die Belichtungszeit genau, und womit vergleichen Sie sie, wenn Sie „sehr kurz“ schreiben? — _„Sehr kurz“ ist nur im Verhältnis zur Strömungsgeschwindigkeit sinnvoll, und dafür braucht man Zahlen._
4. 「sodass Bewegungsunschärfe ausgeschlossen werden kann」（argument/major）Welche Abschätzung zeigt das? Um wie viele Pixel bewegt sich ein Partikel oder eine Struktur bei der höchsten erwarteten Geschwindigkeit während einer Belichtung? — _Die Folgerung ist erst belegt, wenn Belichtungszeit, Geschwindigkeit und Pixelgröße miteinander verrechnet sind._
5. 「Das Schlierenbild zeigt deutlich」（evidence/major）Welches Bild ist gemeint? Gibt es eine nummerierte Abbildung, auf die Sie verweisen können, und was genau sieht man darauf? — _Ein Bild, auf das man sich beruft, das aber nicht gezeigt wird, kann der Betreuer nicht überprüfen._
6. 「Das Schlierenbild」（structure/major）Wo wird der Schlierenaufbau beschrieben, also Lichtquelle, Spiegel bzw. Linsen, Schneide und Strahlengang? Würde eine Skizze dabei helfen? — _Der Schlierenaufbau wird nirgends beschrieben, und damit fehlt der Kern dieses Kapitels._
7. 「Da die Strömung laminar ist」（evidence/major）Woran machen Sie fest, dass die Strömung laminar ist? An einer Reynolds-Zahl, an Literaturwerten oder an der Bildauswertung? — _Laminarität wird hier einfach behauptet. Sie ist aber die Grundlage für die nächste Schlussfolgerung._
8. 「kann der Einfluss auf die Partikel vernachlässigt werden」（argument/major）Warum folgt aus „laminar“, dass der Einfluss vernachlässigbar ist? Welche Größen (z. B. Stokes-Zahl, Partikelgröße, Gasgeschwindigkeit) würden diesen Schritt begründen? — _Auch eine laminare Strömung übt Kräfte auf Partikel aus, deshalb fehlt hier ein Begründungsschritt._
9. 「die Partikel」（clarity/minor）Welche Partikel sind gemeint (Spritzer, Pulver, Tracer), und wo werden sie eingeführt? — _Durch den bestimmten Artikel wirkt es so, als wären die Partikel schon eingeführt, sie tauchen aber hier zum ersten Mal auf._
10. 「über dem Schmelzbad」（clarity/minor）Zu welchem Prozess gehört das Schmelzbad, und welches Gas strömt darüber (Art, Volumenstrom, Düse)? — _Prozess, Werkstoff und Schutzgas werden nicht genannt, und ohne diesen Kontext versteht man den Aufbau nicht._
11. 「wobei sich zeigt, dass das System sehr gut funktioniert」（argument/major）Nach welchem Kriterium „funktioniert“ das System, und wie gut ist „sehr gut“ messbar? Gehört diese Bewertung schon in das Kapitel zum Versuchsaufbau? — _Eine wertende Aussage über Ergebnisse hat im Kapitel zum Versuchsaufbau nichts zu suchen, zumal sie auch nicht belegt ist._
12. 「das System」（terminology/minor）Was genau bezeichnen Sie als „das System“: die Kamera, den Schlierenaufbau oder die gesamte Messanordnung? — _Es bleibt unklar, ob die Kamera, der Schlierenaufbau oder die ganze Anlage gemeint ist._

## zh-essay

```
人工智能对大学教育的影响

随着人工智能的快速发展，越来越多的学生开始使用 ChatGPT 完成作业。调查显示，大部分学生认为 AI 提高了学习效率。因此，学校应该全面禁止 AI 工具。此外，AI 生成的内容经常出错，所以用 AI 的学生成绩一定会下降。总之，AI 对教育弊大于利，这是毋庸置疑的。
```

1. 「调查显示，大部分学生认为 AI 提高了学习效率。」（evidence/major）这是哪一项调查？由谁做的、什么时候做的、调查了多少人、调查对象是哪类学生？“大部分”具体是多少比例？ — _没有来源和数据，老师无法判断这条证据是否可信。_
2. 「因此，学校应该全面禁止 AI 工具。」（argument/major）上一句说学生认为 AI 提高了学习效率，这本来是支持使用 AI 的证据，为什么会推出“应该禁止”？“因此”连接的两句之间推理链条在哪里？ — _前提和结论方向相反，读者会认为论证自相矛盾。_
3. 「全面禁止」（precision/major）“全面”具体指什么范围？是所有课程、所有用途（查资料、润色、写代码），还是只针对作业代写？你的论据能支撑这么绝对的主张吗？ — _主张范围越大，需要的论证就越多；目前的论据远不足以支撑“全面”。_
4. 「AI 生成的内容经常出错」（evidence/major）“经常”是多频繁？在哪些任务、哪些学科中出错？你有什么研究或具体例子可以支撑这一点？ — _这是你的核心论据之一，但目前只是一个没有证据的断言。_
5. 「所以用 AI 的学生成绩一定会下降。」（argument/major）从“AI 内容会出错”到“成绩一定下降”，中间缺了哪些前提？学生会不会核对、修改 AI 的内容？成绩下降是否有数据比较（用与不用 AI 的学生）？“一定”是否过于绝对？ — _这一步跳跃很大，任何反例都能推翻“一定”。_
6. 「此外，」（structure/minor）“此外”引出的这条理由是放在结论“全面禁止”之后的，它是用来支持禁止，还是一个新论点？段落的论点—论据顺序是否应该重新安排？ — _先下结论再补理由，会让读者难以看清论证结构。_
7. 「总之，AI 对教育弊大于利」（argument/major）“弊大于利”需要同时权衡利和弊。文中提到的唯一的“利”（提高效率）你是怎么回应或反驳的？你是否考虑过反方观点？ — _不比较利弊就宣称弊大于利，结论缺乏支撑，议论文也缺少对反方观点的回应。_
8. 「这是毋庸置疑的。」（argument/major）如果这件事毋庸置疑，为什么还需要写一篇论文去论证？学术读者面对目前的论据会同意吗？ — _在证据不足时使用绝对化表述，会削弱作者的可信度。_
9. 「越来越多的学生开始使用 ChatGPT 完成作业」（evidence/minor）“越来越多”有什么数据支撑？另外，文中先写 ChatGPT，后写“AI 工具”和“AI”，你讨论的对象究竟是 ChatGPT 这类生成式 AI，还是所有人工智能？ — _讨论对象不统一，会让论点范围模糊。_
10. 「人工智能对大学教育的影响」（structure/minor）题目是中性的“影响”，但正文是一个明确的反对立场；题目能否让老师一眼看出你的论点？此外，正文几乎没有具体谈到“大学”的情境，这和题目是否一致？ — _题目与正文立场和范围不一致，会影响读者的预期。_
